const express = require("express");
const ModbusRTU = require("modbus-serial");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); 

async function readRegister(ip, plcPort, unitId, register) {
    const client = new ModbusRTU();
    try {
        await client.connectTCP(ip, { port: plcPort });
        client.setID(unitId);
        const data = await client.readHoldingRegisters(register, 1);
        client.close();
        return { success: true, value: data.data[0] };
    } catch (error) {
        client.close();
        return { success: false, error: error.message };
    }
}

async function writeRegister(ip, plcPort, unitId, register, value) {
    const client = new ModbusRTU();
    try {
        await client.connectTCP(ip, { port: plcPort });
        client.setID(unitId);
        await client.writeRegister(register, value);
        client.close();
        return { success: true, message: `Registro ${register} impostato a ${value}` };
    } catch (error) {
        client.close();
        return { success: false, error: error.message };
    }
}

app.get("/read", async (req, res) => {
    const { ip, plcPort, unitId, register } = req.query;
    if (!ip || !plcPort || !unitId || !register) {
        return res.status(400).json({ success: false, error: "Parametri mancanti" });
    }

    const result = await readRegister(ip, Number(plcPort), Number(unitId), Number(register));
    res.json(result);
});

app.post("/write", async (req, res) => {
    const { ip, plcPort, unitId, register, value } = req.body;
    if (!ip || !plcPort || !unitId || !register || value === undefined) {
        return res.status(400).json({ success: false, error: "Parametri mancanti" });
    }

    const result = await writeRegister(ip, Number(plcPort), Number(unitId), Number(register), Number(value));
    res.json(result);
});

app.listen(port, () => {
    console.log(`Server API Modbus in ascolto su http://localhost:${port}`);
});


/*
    Esempio lettura:
    curl "http://localhost:3000/read?ip=telecameretrend.controlliamo.com&plcPort=502&unitId=250&register=100"

    Esempio scrittura:
    curl -X POST "http://localhost:3000/write"  -H "Content-Type: application/json" -d "{\"ip\": \"telecameretrend.controlliamo.com\", \"plcPort\": 502, \"unitId\": 250, \"register\": 100, \"value\": 5678}"

*/