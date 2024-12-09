import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import AdmZip from "adm-zip";
import path from "path";
import { getProjectRoot } from "../../utils/getProjectRoot";
import { BACKEND_URL } from "../../config/internal-config";

export async function sendFile(zipFilePath: string, id: number, token: string) {
  try {
    // Prepare form data
    const form = new FormData();
    form.append("file", fs.createReadStream(zipFilePath));

    // Send the zipped artifact
    const response = await axios
      .post(`${BACKEND_URL}/deployments/${id}/upload-artifacts`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log(res.data);
        console.log("Artifacts uploaded successfully");
      })
      .catch((err) => {
        console.log(err.status);
        console.log(err.message);
        console.log("Failed to upload artifacts");
        process.exit(1);
      });

    // Clean up the zip file
    fs.unlinkSync(zipFilePath);
  } catch (error: any) {
    console.error("Failed to send file:", error.message);
  }
}

export async function zipFile() {
  try {
    // Create a zip file
    const zip = new AdmZip();
    const projectRoute = await getProjectRoot();
    // Add all files from the artifacts folder
    const artifactsFolderPath = path.join(projectRoute, "artifacts");
    zip.addLocalFolder(artifactsFolderPath);

    const zipFilePath = path.join(projectRoute, "artifact.zip");
    zip.writeZip(zipFilePath);

    return zipFilePath;
  } catch (error: any) {
    console.error("Failed to zip file:", error.message);
    process.exit(1);
  }
}
