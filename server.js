import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const API_KEY = process.env.PODPAY_KEY;

let pedidos = {};

app.post("/criar-pix", async (req, res) => {

  const { nome, email, cpf, telefone, valor } = req.body;

  try {
    const response = await fetch("https://api.podpay.app/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      },
      body: JSON.stringify({
        paymentMethod: "pix",
        amount: valor,
        customer: {
          name: nome,
          email: email,
          phone: telefone,
          document: {
            type: "cpf",
            number: cpf
          }
        },
        items: [
          {
            title: "Pedido",
            unitPrice: valor,
            quantity: 1,
            tangible: true
          }
        ]
      })
    });

    const data = await response.json();

    if(data.success){

      pedidos[data.data.id] = {
        status: "pending"
      };

      res.json({
        id: data.data.id,
        qr: data.data.pixQrCodeImage,
        copia: data.data.pixQrCode
      });

    } else {
      res.status(400).json(data);
    }

  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});


app.post("/webhook", (req, res) => {

  if(req.body.event === "transaction.completed"){
    const id = req.body.data.id;

    if(pedidos[id]){
      pedidos[id].status = "pago";
      console.log("PAGO:", id);
    }
  }

  res.sendStatus(200);
});


app.get("/status/:id", (req, res) => {
  res.json(pedidos[req.params.id] || {});
});

app.listen(3000, () => console.log("rodando"));
