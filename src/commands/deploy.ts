import axios from "axios";
import { getToken } from "./auth/store-token/store";
import fs from 'fs';
import FormData from 'form-data';
import AdmZip from 'adm-zip';
import path from 'path';

// WIP
export async function deploy() {
  let token = await getToken();

  if (!token) {
    console.log('You need to authenticate first. Run "anyflow auth".');
    return;
  }

  console.log("Preparing artifact for deployment...");
  
  try {
    // Create a zip file
    const zip = new AdmZip();
    // Add all files from the artifacts folder
    const artifactsFolderPath = path.join(process.cwd(), 'artifacts');
    zip.addLocalFolder(artifactsFolderPath);

    const zipFilePath = path.join(process.cwd(), 'artifact.zip');
    zip.writeZip(zipFilePath);

    // Prepare form data
    const form = new FormData();
    form.append('file', fs.createReadStream(zipFilePath));

    // Send the zipped artifact
    const response = await axios.post("http://localhost/api/deployments/upload-artifacts", {
      headers: form.getHeaders()
    }).then(res => {
      console.log(res.data)
    }).catch(err => {
      console.error(err)
    })
    
    console.log("Deployment successful:", response);

    // Clean up the zip file
    fs.unlinkSync(zipFilePath);
  } catch (error: any) {
    console.error("Failed to deploy:", error.message);
  }
}
