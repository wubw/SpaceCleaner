// Configuration file for SpaceCleaner
// Modify these paths to match your environment

const CONFIG = {
  // API base URL
  apiBaseUrl: "http://localhost:3001",

  // Default paths shown on page load
  defaults: {
    source: "C:\\Users\\binweiwu\\OneDrive - Microsoft",
    target: "D:\\HotData",
  },

  // Preset configurations for quick setup buttons
  presets: {
    pc2disk: {
      source: "C:\\Users\\BinweiWu.REDMOND\\OneDrive - Microsoft",
      target: "H:\\01 HotData",
    },
    usb2disk: {
      source: "D:\\Warm Data\nD:\\Cool Data",
      target: "H:\\Warm Data\nH:\\Cool Data",
    },
    opttest: {
      source: "/Users/binweiwu/Documents/2 Personal",
      target: "/Users/binweiwu/Downloads/Test",
    },
    disk2disk: {
      source: "D:\\HotData\nD:\\ColdData\nD:\\WarmData\nD:\\CoolData",
      target: "E:\\HotData\nE:\\ColdData\nE:\\WarmData\nE:\\CoolData",
    },
  },
};
