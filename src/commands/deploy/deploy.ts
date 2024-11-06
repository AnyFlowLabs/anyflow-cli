import { getToken } from "../auth/store-token/store";
import { writeDeploymentId } from "./deployment";
import { sendFile, zipFile } from "./artifacts";
import { createDeployment } from "./deployment";
import { runCommand } from "./command";

export async function deploy(network: string[]) {
  if (!network || network.length < 1) {
    console.error("Please specify a network using --networks");
    process.exit(1);
  }

  let token = await getToken();

  if (!token) {
    console.log('You need to authenticate first. Run "anyflow auth".');
    return;
  }

  console.log("Creating deployment...");

  const deployment = await createDeployment(network, token);

  console.log("Deployment created");

  const ids: number[] = deployment.data.chain_deployment_ids;

  await Promise.all(
    ids.map(async (id) => {
      await writeDeploymentId(id);

      await runCommand(network);
    })
  );

  console.log("Preparing artifact for deployment...");

  const zipFilePath = await zipFile();

  await sendFile(zipFilePath, deployment.data.id, token);
}
