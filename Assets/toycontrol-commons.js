var ToyControlCommons = {
    timeInterval: null,
    patternDateStarted: null,
    createButton: (text, device, action) => {
        let btn = document.createElement('button');
        btn.setAttribute("class", "c_btn");
        btn.device = device;
        btn.onclick = action;
        btn.innerText = text;
        return btn;
    },
    stopPatternInterval: (device) => {
        if (ToyControlCommons.timeInterval) {
            clearInterval(ToyControlCommons.timeInterval);
        }
    },
    stopVibrating: (device) => {
        ToyControlCommons._vibrate(device, 0);
    },
    startPattern: (device, patternName) => {
        ToyControlCommons.stopPatternInterval(device);
        ToyControlCommons.stopVibrating(device);

        let pattern;
        switch (patternName) {
            case '1':
                pattern = ToyControlCommons.playPatternLow;
                break;
            case '2':
                pattern = ToyControlCommons.playPatternMiddle;
                break;
            case '3':
                pattern = ToyControlCommons.playPatternHigh;
                break;
            case '4':
                pattern = ToyControlCommons.playPatternOrgasmic;
                break;
            default:
                break;
        }
        ToyControlCommons.startPatternInternal(device, pattern);
    },
    startPatternInternal: (device, pattern) => {
        ToyControlCommons.patternDateStarted = new Date();
        ToyControlCommons.timeInterval = setInterval(() => {
            pattern(device, new Date() - ToyControlCommons.patternDateStarted);
        }, 10);
    },
    playPatternLow: (device, millisecondsEllapsed) => {
        ToyControlCommons.playPatternTimed(device, millisecondsEllapsed, 1, 500);
    },
    playPatternMiddle: (device, millisecondsEllapsed) => {
        ToyControlCommons.playPatternTimed(device, millisecondsEllapsed, 1, 300);
    },
    playPatternHigh: (device, millisecondsEllapsed) => {
        ToyControlCommons.playPatternTimed(device, millisecondsEllapsed, 1, 150);
    },
    playPatternTimed: (device, millisecondsEllapsed, intensity, rythm) => {
        let millisecondsRounded = Math.round(millisecondsEllapsed / 10) * 10;
        let modulo = millisecondsRounded % rythm;
        
        if (modulo == 0) {
            if (device.isVibrating) {
                ToyControlCommons._vibrate(device, 0);
            }
            else {
                ToyControlCommons._vibrate(device, intensity);
            }
        }
    },
    playPatternOrgasmic: (device, millisecondsEllapsed) => {
        let timeInSeconds = millisecondsEllapsed / 1000;
        let milliseconds = timeInSeconds - Math.trunc(timeInSeconds);
        if (device.isVibrating && milliseconds < 0.2) {
            ToyControlCommons._vibrate(device, 0);
        }
        else {
            ToyControlCommons._vibrate(device, milliseconds);
        }
    },
    vibrate: async (device, vibration) => {
        ToyControlCommons.stopPatternInterval(device);        
        ToyControlCommons._vibrate(device, vibration);
    },
    _vibrate: (device, vibration) => {
        ButtplugWrapper.vibrate(device, vibration);
        if (vibration == 0) {
            device.isVibrating = false;
        }
        else {
            device.isVibrating = true;
        }
    }

}