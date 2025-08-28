const { PinataSDK } = require("pinata");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Use JWT authentication as shown in Pinata docs
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "apricot-neat-tick-628.mypinata.cloud", // Replace with your gateway
});

async function storeImages(imagesFilePath) {
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  console.log(files);

  let responses = [];
  console.log("Uploading to PINATA...........");

  for (const file of files) {
    try {
      const filePath = path.join(fullImagesPath, file);
      const fileBuffer = fs.readFileSync(filePath);

      // Create a File object from the buffer (as shown in Pinata docs)
      const fileObject = new File([fileBuffer], file, {
        type: getContentType(file),
      });

      const upload = await pinata.upload.public.file(fileObject);
      responses.push(upload);
      //   console.log(`Uploaded ${file}:`, upload);
    } catch (error) {
      console.log(`Error uploading ${file}:`, error.message);
    }
  }
  console.log("SuccessFully uploaded to PINATA...........");
  return { responses, files };
}

// Helper function to determine content type
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  return contentTypes[ext] || "application/octet-stream";
}

async function storeTokenUriMetaData(metadata) {
  //   console.log(metadata);
  try {
    // Convert the JavaScript object to JSON string
    const jsonString = JSON.stringify(metadata); // null, 2 for pretty formatting
    // console.log(jsonString);
    // Create a File object with JSON content
    const filename = `${metadata.name}-metadata.json`;
    const file = new File([jsonString], filename, {
      type: "application/json",
    });
    // Upload to Pinata
    const upload = await pinata.upload.public.file(file);
    // console.log(`Uploaded :`, upload);
    return upload;
  } catch (error) {
    console.log(`Error uploading :`, error.message);
  }
  return null;
}

module.exports = { storeImages, storeTokenUriMetaData };
