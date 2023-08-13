"use strict";const e=require("electron");e.app.whenReady().then(()=>{new e.BrowserWindow().loadURL(process.env.VITE_DEV_SERVER_URL)});
