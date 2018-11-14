{
    "audioCodec": "PCMU",
    "_stunServer": "stun.sipnet.ru:3478",
    "dataStorageDays": 100,
    "web": "disable",
    "sipServer": "disable",
    "webAuth": "disable",
    "maxCalls": 10,
    "ringingTimeout": "30",
    "serviceName": "MARS",
    "activeAccount": 0,
    "def_tts": "yandex",
    "recognize": {
        "type": "yandex",
        "options": {
            "developer_key": "",
            "model": "general"
        }
    },
    "sipAccounts": {},
    "levels": {
        "[all]": "trace"
    },
    "appenders": [
        {
            "type": "console",
            "category": [
                "console",
                "server",
                "ua",
                "call",
                "error"
            ]
        }
    ],
    "replaceConsole": "false"
}