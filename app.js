const express = require("express");
const app = express();
const multer = require("multer");
const upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});

//MS Specific
const axios = require("axios").default;
const async = require("async");
const fs = require("fs");
const https = require("https");
const path = require("path");
const createReadStream = require("fs").createReadStream;
const sleep = require("util").promisify(setTimeout);
const ComputerVisionClient =
  require("@azure/cognitiveservices-computervision").ComputerVisionClient;
const ApiKeyCredentials = require("@azure/ms-rest-js").ApiKeyCredentials;

require("dotenv").config({ path: "./config/.env" });

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const key = process.env.MS_COMPUTER_VISION_SUBSCRIPTION_KEY;
const endpoint = process.env.MS_COMPUTER_VISION_ENDPOINT;
const faceEndpoint = process.env.MS_FACE_ENDPOINT;
const subscriptionKey = process.env.MS_FACE_SUB_KEY;

const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": key } }),
  endpoint
);

//Server Setup
app.set("view engine", "ejs");
app.use(express.static("public"));

//Routes
app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/", upload.single("file-to-upload"), async (req, res) => {
  let rugbyBallCount = 0
  let sportsBallCount = 0
  let noObjects = 0
  try {
    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);
    const objectURL = result.secure_url;

    //DELETE EVERYTHING BELOW HERE EXCEPT THE SNIPPET YOU WANT FOR THE TYPE OF APP
    /**
         * DETECT OBJECTS
         * Detects objects in URL image:
         *     gives confidence score, shows location of object in image (bounding box), and object size. 
         */
     console.log('-------------------------------------------------');
     console.log('DETECT OBJECTS');
     console.log();

     // <snippet_objects>
     // Image of a dog
    //  const objectURL = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-node-sdk-samples/master/Data/image.jpg';

     // Analyze a URL image
     console.log('Analyzing objects in image...', objectURL.split('/').pop());
     const objects = (await computerVisionClient.analyzeImage(objectURL, { visualFeatures: ['Objects'] })).objects;
     console.log();
  
     // Print objects bounding box and confidence
     if (objects.length) {
       console.log(`${objects.length} object${objects.length == 1 ? '' : 's'} found:`);
       for (const obj of objects) { 
        if (obj.object === 'Rugby ball') {
          rugbyBallCount++
        } else if (obj.object === 'sports ball') {
          sportsBallCount++
        }
         console.log(
           `    ${obj.object} (${obj.confidence.toFixed(2)})
           at ${formatRectObjects(obj.rectangle)}`);
        }
     } else { 
      noObjects++ 
      console.log('No objects found.'); 
      }
     // </snippet_objects>

     // <snippet_objectformat>
     // Formats the bounding box
     function formatRectObjects(rect) {
       return `top=${rect.y}`.padEnd(10) + `left=${rect.x}`.padEnd(10) + `bottom=${rect.y + rect.h}`.padEnd(12)
         + `right=${rect.x + rect.w}`.padEnd(10) + `(${rect.w}x${rect.h})`;
     }
     // </snippet_objectformat>
     /**
      * END - Detect Objects
      */
    //DELETE ALL THE WAY DOWN TO THIS LINE
    res.render("result.ejs", { count: rugbyBallCount, img: objectURL, sports: sportsBallCount, noObjectCount: noObjects });
  } catch (err) {
    console.log(err);
  }
});

app.listen(process.env.PORT || 2121);
