function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Initialize default values from config
$(document).ready(function () {
  $("#searchtxtbox").val(CONFIG.defaults.source);
  $("#backuptxtbox").val(CONFIG.defaults.target);
});

$("#startbtn").click(function () {
  const resultempty = $("#resultempty");
  const resultduplicates = $("#resultduplicates");
  resultempty.empty();
  resultduplicates.empty();
  $("#btndiv").hide();

  const cleanempty = $("#cleanemptycb").prop("checked");
  const findreplicates = $("#findreplicatescb").prop("checked");

  $.get(
    CONFIG.apiBaseUrl + "/overview",
    {
      rootpath: $("#searchtxtbox").val(),
      cleanempty: cleanempty,
      findreplicates: findreplicates,
    },
    function (data) {
      const overviewtb = $("#overviewtb");
      overviewtb
        .empty()
        .append(
          "<caption>Overview</caption><tr><th>path</th><th>size</th><th>count</th></tr>"
        );
      const parsedData = JSON.parse(data);
      const overviewList = parsedData.overview;
      let totalsize = 0;
      let totalcount = 0;
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
        const emptyList = parsedData.findings.emptyList;
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
        const duplicatesList = parsedData.findings.duplicatesList;
        if (duplicatesList.length > 0) {
          let idx = 0;
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
  const removefiles = [];
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
    CONFIG.apiBaseUrl + "/cleanup",
    { data: JSON.stringify(removefiles) },
    function (data) {}
  );
});

$("#backupbtn").click(function () {
  $.get(
    CONFIG.apiBaseUrl + "/backup",
    {
      rootpath: $("#searchtxtbox").val(),
      backuprootpath: $("#backuptxtbox").val(),
    },
    function (data) {
      const resulttb = $("#resulttb");
      resulttb.empty();
      const resultduplicates = $("#resultduplicates");
      resultduplicates.empty();
      $("#btndiv").hide();

      const overviewtb = $("#overviewtb");
      overviewtb
        .empty()
        .append(
          "<caption>Overview</caption><tr><th>path</th><th>type</th></tr>"
        );
      const overviewList = JSON.parse(data).data;
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
  $.get(
    CONFIG.apiBaseUrl + "/cleanrubbish",
    { rootpath: $("#searchtxtbox").val() },
    function (data) {
      const resulttb = $("#resulttb");
      resulttb.empty().append("<tr><th>Path</th><th>Is Directory</th></tr>");
      const currentdata = JSON.parse(data).data;
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
  const currentdata = $("#searchtxtbox").val().split(/\r?\n/);
  $.post(
    CONFIG.apiBaseUrl + "/compress",
    { data: JSON.stringify(currentdata) },
    function (data) {}
  );
});

$("#pc2disk").click(function () {
  $("#searchtxtbox").val(CONFIG.presets.pc2disk.source);
  $("#backuptxtbox").val(CONFIG.presets.pc2disk.target);
});

$("#usb2disk").click(function () {
  $("#searchtxtbox").val(CONFIG.presets.usb2disk.source);
  $("#backuptxtbox").val(CONFIG.presets.usb2disk.target);
});

$("#opttest").click(function () {
  $("#searchtxtbox").val(CONFIG.presets.opttest.source);
  $("#backuptxtbox").val(CONFIG.presets.opttest.target);
});

$("#disk2disk").click(function () {
  $("#searchtxtbox").val(CONFIG.presets.disk2disk.source);
  $("#backuptxtbox").val(CONFIG.presets.disk2disk.target);
});

