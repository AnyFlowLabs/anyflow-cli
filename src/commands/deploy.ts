import axios from "axios";
import { getToken } from "./auth/store-token/store";
import fs from 'fs';
import FormData from 'form-data';
import AdmZip from 'adm-zip';
import path from 'path';
import { getProjectRoot } from "../utils/getProjectRoot";
import { getUser, getUserResponse } from "./auth/api/user";

type Deployment ={
  chains: number[],
  framework: "hardhat",
  user_id: number,
  container_image: "anyflow-node-20"
}

export async function deploy() {
  let token = await getToken();

  if (!token) {
    console.log('You need to authenticate first. Run "anyflow auth".');
    return;
  }

  console.log("Preparing artifact for deployment...");
  
  // const zipFilePath = await zipFile()

  const deployment = await createDeployment(token)

  // await sendFile(zipFilePath, 1)
}

async function createDeployment(token: string) {
  const userResponse = await getUserResponse(token).catch((err) => {
    console.error("Failed to retrieve user, try authenticate:", err.message);
    process.exit(1)
  })
  
  const deployment: Deployment = {
    user_id: userResponse.data.id || 1,
    framework: "hardhat",
    chains: [11155111],
    container_image: "anyflow-node-20"
  }

  const response = await axios.post(`http://localhost:5173/api/deployments`, deployment, {
    headers: {
      'Accept': "*/*",
      'Content-Type': 'application/json',
    }
  }).then(res => {
    console.log(res.data)
  }).catch(err => {
    console.error("Error response:", err.response ? err.response.data : err.message);
  })
}

async function sendFile(zipFilePath: string, id: number) {
  try {
    // Prepare form data
    const form = new FormData();
    form.append('file', fs.createReadStream(zipFilePath));

    // Send the zipped artifact
    const response = await axios.post(`http://localhost:80/api/deployments/${id}/upload-artifacts`, form, {
      headers: form.getHeaders(),
    }).then(res => {
      console.log(res.data)
    }).catch(err => {
      console.error(err)
    })

    console.log("Deployment successful:", response);

    // Clean up the zip file
    fs.unlinkSync(zipFilePath); 
  } catch (error: any)   {
    console.error("Failed to send file:", error.message);
  }
}

async function zipFile() {
  try {
    // Create a zip file
    const zip = new AdmZip();
    const projectRoute = await getProjectRoot()
    // Add all files from the artifacts folder
    const artifactsFolderPath = path.join(projectRoute, 'artifacts');
    zip.addLocalFolder(artifactsFolderPath);

    const zipFilePath = path.join(projectRoute, 'artifact.zip');
    zip.writeZip(zipFilePath);

    return zipFilePath
  } catch (error: any) {
    console.error("Failed to zip file:", error.message);
    process.exit(1)
  }
}