const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // Cargar variables de entorno desde .env solo en desarrollo
}


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',  // Permitir cualquier origen
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'],  // Encabezados permitidos
}));

app.use(bodyParser.json());
// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI) // Utiliza la variable de entorno
  .then(() => {
    console.log('Conectado a MongoDB');
  })
  .catch((err) => console.error('Error al conectar MongoDB', err));



// Verificar si el modelo ya está registrado para evitar duplicados
const Trabajo = mongoose.models.Trabajo || mongoose.model('Trabajo', new mongoose.Schema({
    dia: String,
    horaEntrada: String,
    horaSalida: String
}));




// Ruta para guardar un nuevo trabajo
app.post('/trabajos', async (req, res) => {
    let { dia, horaEntrada, horaSalida } = req.body;

    // Verificar que los campos estén presentes
    if (!dia || !horaEntrada || !horaSalida) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validación de formatos
    const diaRegex = /^\d{2}\/\d{2}\/\d{2}$/; // dd/mm/yy
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm

    if (!diaRegex.test(dia)) {
        return res.status(400).json({ error: 'El formato de fecha debe ser dd/mm/yy' });
    }

    if (!horaRegex.test(horaEntrada) || !horaRegex.test(horaSalida)) {
        return res.status(400).json({ error: 'El formato de hora debe ser HH:mm' });
    }

    // Enviar los datos en formato String
    const nuevoTrabajo = new Trabajo({
        dia,           // se guarda como String en formato dd/MM/yy
        horaEntrada,   // se guarda como String en formato HH:mm
        horaSalida     // se guarda como String en formato HH:mm
    });

    try {
        const trabajoGuardado = await nuevoTrabajo.save();
        res.status(200).json(trabajoGuardado);
    } catch (error) {
        console.error('Error al guardar el trabajo:', error);
        res.status(500).json({ error: 'Error al guardar el trabajo en MongoDB' });
    }
});

app.get('/trabajos', async (req, res) => {
    try {
      const trabajos = await Trabajo.find();  // Obtener todos los trabajos
      res.status(200).json(trabajos);  // Devolver los trabajos en la respuesta
    } catch (error) {
      console.error('Error al obtener los trabajos:', error);
      res.status(500).json({ error: 'Error al obtener los trabajos' });
    }
  });

  app.get('/trabajos/:mongoId', (req, res) => {
    const mongoId = req.params.mongoId;
    Trabajo.findById(mongoId)  // Usa el _id real de MongoDB
      .then(trabajo => {
        if (trabajo) {
          res.json(trabajo);
        } else {
          res.status(404).json({ error: 'Trabajo no encontrado' });
        }
      })
      .catch(error => {
        res.status(500).json({ error: 'Error al obtener el trabajo' });
      });
  });

  app.get('/', (req, res) => {
    res.send('Bienvenido a la API de Trabajos');
  });
  
  
  

// Iniciar el servidor
app.listen(process.env.PORT || 3000, ()  => {
    console.log(`Servidor ejecutándose en http://localhost:${process.env.PORT || 3000}`);
});
