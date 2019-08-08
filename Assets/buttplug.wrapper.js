var ButtplugWrapper = {
    client: null,
    init: (viewInitializer)=>{this.viewInitializer = viewInitializer;},
    connectToys: async (connectAddress) => {
        if (connectAddress == 'debug') {
            ButtplugDevTools.CreateLoggerPanel(Buttplug.ButtplugLogger.Logger);
            ButtplugWrapper.client = await ButtplugDevTools.CreateDevToolsClient(Buttplug.ButtplugLogger.Logger);
            ButtplugDevTools.CreateDeviceManagerPanel(client.Connector.Server);
        }
        else {
            ButtplugWrapper.client = new Buttplug.ButtplugClient("Tutorial Client");
        }
    
        this.viewInitializer.init();
    
        ButtplugWrapper.client.addListener('deviceadded', async (device) => {
            viewInitializer.generateli(device);
            await ButtplugWrapper.client.StopScanning();
        });
        ButtplugWrapper.client.addListener('deviceremoved', async (device) => {
            viewInitializer.removeli(device);
        });
    
        try {
            if (connectAddress !== undefined && connectAddress !== 'debug') {
                const connector = new Buttplug.ButtplugBrowserWebsocketClientConnector("wss://localhost:12345/buttplug");
                await ButtplugWrapper.client.Connect(connector);
            }
            else if (connectAddress == 'debug') {
    
            }
            else {
                const connector = new Buttplug.ButtplugEmbeddedClientConnector();
                await ButtplugWrapper.client.Connect(connector);
            }
        } catch (e) {
            console.log(e);
            return;
        }
    
        await ButtplugWrapper.client.StartScanning();
    },
   vibrate: async (device, intensity) =>{
        try {
          await device.SendVibrateCmd(intensity);
        }
        catch (e) {
            viewInitializer.connexionLostHandler(e);
        }
      }
}