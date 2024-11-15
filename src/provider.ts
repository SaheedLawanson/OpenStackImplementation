import express from "express";
import * as schemas from "./schemas";
import * as opStack from "./openstack";

const router = express.Router();

router.get("/instances", async (req, res, next) => {
  try {
    const data = await opStack.listInstances();
    const available_servers = await Promise.all(
      data.servers.map((server) => opStack.getInstanceById(server.id))
    );

    res.status(200).json({
      message: "Successfully fetched avaialable servers",
      data: available_servers
        .map((data) => data.server)
        .filter((data) => data.status !== "ACTIVE"),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/instances", async (req, res, next) => {
  try {
    const reqBody = await schemas.createInstance.validate(req.body, {
      stripUnknown: true,
    });

    const flavorData = await opStack.getFlavor(reqBody.flavourId)
    if (!flavorData) throw "Invalid flavor id provided"

    const networkData = await opStack.getNetwork(reqBody.networkId)
    if (!networkData) throw "Invalid network id provided"

    const imageData = await opStack.getMachineImageById(reqBody.imageId)
    if (!imageData) throw "Invalid image id provided"


    const instance_id = await opStack.createInstance(
      reqBody.flavourId,
      reqBody.imageId,
      reqBody.name,
      reqBody.securityGroups,
      reqBody.networkId,
    )

    res.status(200).json({ message: "Instance successfully created", data: { instance_id }})
  } catch (error) {
    next(error);
  }
});

export default router;
