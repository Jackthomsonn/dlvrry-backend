import { Environment } from "../enums/env";

export const get_env = () => {
  return process.env.FUNCTIONS_EMULATOR === "true"
    ? Environment.TEST
    : Environment.PROD;
};
