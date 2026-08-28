#!/usr/bin/env node

import {captureInventory, verifyInventory} from "./application-repository-inventory-lib.mjs";

function main(arguments_) {
  const [operation, root, inventoryPath, operationPath] = arguments_;
  if (arguments_.length !== 4 || !["capture", "verify"].includes(operation)) {
    throw new Error(
      "Usage: application-repository-inventory.mjs capture ROOT INVENTORY PATHS | verify ROOT INVENTORY GIT_DIR",
    );
  }

  if (operation === "capture") {
    captureInventory(root, inventoryPath, operationPath);
    console.log("Application inventory captured.");
  } else {
    verifyInventory(root, inventoryPath, operationPath);
    console.log("Application inventory verified.");
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Application inventory failed.");
  process.exitCode = 1;
}
