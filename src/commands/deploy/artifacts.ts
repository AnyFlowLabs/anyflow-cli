import fs from 'fs';
import path from 'path';

import FormData from 'form-data';
import AdmZip from 'adm-zip';

import { getProjectRoot } from '../../utils/getProjectRoot';
import axios from '../../utils/axios';
import { EXIT_CODE_GENERIC_ERROR } from '../../utils/exitCodes';

export async function sendFile(zipFilePath: string, id: number) {
  try {
    // Prepare form data
    const form = new FormData();
    form.append('file', fs.createReadStream(zipFilePath));

    // Send the zipped artifact
    const response = await axios
      .post(`api/deployments/${id}/upload-artifacts`, form, {
        headers: {
          ...form.getHeaders(),
        },
      })
      .then((res) => {
        console.log(res.data);
        console.log('Artifacts uploaded successfully');
      })
      .catch((err) => {
        console.log(err.status);
        console.log(err.message);
        console.log('Failed to upload artifacts');
        process.exit(EXIT_CODE_GENERIC_ERROR);
      });

    // Clean up the zip file
    fs.unlinkSync(zipFilePath);
  } catch (error: any) {
    console.error('Failed to send file:', error.message);
  }
}

export async function zipFile() {
  // Check if artifacts folder exists
  const projectRoute = await getProjectRoot();
  const artifactsFolderPath = path.join(projectRoute, 'artifacts');
  if (!fs.existsSync(artifactsFolderPath)) {
    console.error('Artifacts folder not found. Did you forget to compile the project?');
    process.exit(EXIT_CODE_GENERIC_ERROR);
  }

  try {
    // Create a zip file
    const zip = new AdmZip();

    // Add all files from the artifacts folder
    const artifactsFolderPath = path.join(projectRoute, 'artifacts');
    zip.addLocalFolder(artifactsFolderPath);

    const zipFilePath = path.join(projectRoute, 'artifact.zip');
    zip.writeZip(zipFilePath);

    return zipFilePath;
  } catch (error: any) {
    console.error('Failed to zip file:', error.message);
    process.exit(EXIT_CODE_GENERIC_ERROR);
  }
}
