function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

$("#startbtn").click(function () {
  var resultempty = $("#resultempty");
  var resultduplicates = $("#resultduplicates");
  resultempty.empty();
  resultduplicates.empty();
  $("#btndiv").hide();

  var cleanempty = $("#cleanemptycb").prop("checked");
  var findreplicates = $("#findreplicatescb").prop("checked");

  $.get(
    "http://localhost:3001/overview",
    {
      rootpath: $("#searchtxtbox").val(),
      cleanempty: cleanempty,
      findreplicates: findreplicates,
    },
    function (data) {
      var overviewtb = $("#overviewtb");
      overviewtb
        .empty()
        .append(
          "<caption>Overview</caption><tr><th>path</th><th>size</th><th>count</th></tr>"
        );
      overviewList = JSON.parse(data).overview;
      var totalsize = 0;
      var totalcount = 0;
      overviewList.forEach(function (element) {
        overviewtb.append(
          "<tr><td>" +
            element.path +
            "</td><td>" +
            numberWithCommas(element.size) +
            "</td><td>" +
            element.count +
            "</td></tr>"
        );
        totalsize += element.size;
        totalcount += element.count;
      });
      overviewtb.append(
        "<tr><td>TOTAL" +
          "</td><td>" +
          numberWithCommas(totalsize) +
          "</td><td>" +
          totalcount +
          "</td></tr>"
      );

      if (cleanempty) {
        emptyList = JSON.parse(data).findings.emptyList;
        if (emptyList.length > 0) {
          resultempty
            .empty()
            .append(
              "<caption>Empty</caption><tr><th>Path</th><th>Is Directory</th></tr>"
            );
          emptyList.forEach(function (element) {
            resultempty.append(
              '<tr><td><label><input type="checkbox" checked>' +
                element.path +
                "</label></td><td>" +
                element.isDirectory +
                "</td></tr>"
            );
          });
          $("#btndiv").show();
        }
      }

      if (findreplicates) {
        resultduplicates.empty();
        var duplicatesList = JSON.parse(data).findings.duplicatesList;
        if (duplicatesList.length > 0) {
          var idx = 0;
          resultduplicates.append(
            "<div><b>Duplicated files are found, select to remove.</b></div><br>"
          );
          duplicatesList.forEach(function (elem) {
            resultduplicates.append(
              "<div>File size:  " + numberWithCommas(elem.filesize) + "<br>"
            );
            elem.files.forEach(function (element) {
              resultduplicates.append(
                '<label><input type="radio" name="' +
                  idx +
                  '">' +
                  element +
                  "</label><br>"
              );
            });
            resultduplicates.append("<br></div>");
            idx++;
          });
          $("#btndiv").show();
        }
      }
    }
  );
});

$("#cleanupbtn").click(function () {
  var removefiles = [];
  $("input[type=radio]:checked")
    .parent("label")
    .each(function () {
      removefiles.push(this.textContent);
    });
  $("input[type=checkbox]:checked")
    .parent("label")
    .each(function () {
      removefiles.push(this.textContent);
    });

  $.post(
    "http://localhost:3001/cleanup",
    { data: JSON.stringify(removefiles) },
    function (data) {}
  );
});

$("#backupbtn").click(function () {
  $.get(
    "http://localhost:3001/backup",
    {
      rootpath: $("#searchtxtbox").val(),
      backuprootpath: $("#backuptxtbox").val(),
    },
    function (data) {
      var resulttb = $("#resulttb");
      resulttb.empty();
      var resultduplicates = $("#resultduplicates");
      resultduplicates.empty();
      $("#btndiv").hide();

      var overviewtb = $("#overviewtb");
      overviewtb
        .empty()
        .append(
          "<caption>Overview</caption><tr><th>path</th><th>type</th></tr>"
        );
      overviewList = JSON.parse(data).data;
      if (overviewList.onlySrc) {
        overviewList.onlySrc.forEach(function (element) {
          overviewtb.append(
            "<tr><td><label>" + element.src + "</td><td>onlySrc</td></tr>"
          );
        });
      }
      if (overviewList.differentContent) {
        overviewList.differentContent.forEach(function (element) {
          overviewtb.append(
            "<tr><td><label>" +
              element.src +
              "</td><td>differentContent</td></tr>"
          );
        });
      }
    }
  );
});

$("#cleanrubbishbtn").click(function () {
  var currentdata = null;
  $.get(
    "http://localhost:3001/cleanrubbish",
    { rootpath: $("#searchtxtbox").val() },
    function (data) {
      var resulttb = $("#resulttb");
      resulttb.empty().append("<tr><th>Path</th><th>Is Directory</th></tr>");
      currentdata = JSON.parse(data).data;
      currentdata.forEach(function (element) {
        resulttb.append(
          "<tr><td>" +
            element.path +
            "</td><td>" +
            element.isDirectory +
            "</td></tr>"
        );
      });
      $("#btndiv").show();
    }
  );
});

$("#compressbtn").click(function () {
  var currentdata = $("#searchtxtbox").val().split(/\r?\n/);
  $.post(
    "http://localhost:3001/compress",
    { data: JSON.stringify(currentdata) },
    function (data) {}
  );
});

$("#optmac2disk").click(function () {
  var src = "/Users/binweiwu/Documents\n/Users/binweiwu/WarmData";
  $("#searchtxtbox").val(src);
  var tgt = "/Volumes/4TDisk/01 HotData\n/Volumes/4TDisk/02 WarmData";
  $("#backuptxtbox").val(tgt);
});

$("#optusb2disk").click(function () {
  var src = "/Volumes/Binwei_Flash/01 Books";
  $("#searchtxtbox").val(src);
  var tgt = "/Volumes/4TDisk/02 WarmData/01 Books";
  $("#backuptxtbox").val(tgt);
});

$("#opttest").click(function () {
  var src = "/Users/binweiwu/Documents/2 Personal";
  $("#searchtxtbox").val(src);
  var tgt = "/Users/binweiwu/Downloads/Test";
  $("#backuptxtbox").val(tgt);
});

$("#optdisk2disk-mac").click(function () {
  var src =
    "/Volumes/4TDisk/01 HotData\n/Volumes/4TDisk/02 WarmData\n/Volumes/4TDisk/03 CoolData\n/Volumes/4TDisk/04 ColdData\n/Volumes/4TDisk/ImportantNotes";
  $("#searchtxtbox").val(src);
  var tgt =
    "/Volumes/5TDisk/01 HotData\n/Volumes/5TDisk/02 WarmData\n/Volumes/5TDisk/03 CoolData\n/Volumes/5TDisk/04 ColdData\n/Volumes/5TDisk/ImportantNotes";
  $("#backuptxtbox").val(tgt);
});

