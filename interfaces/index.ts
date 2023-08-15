import { Relay } from "~/db/db";
import { DockerStatus } from "enums";

export interface RelayExtended extends Relay {
    status: DockerStatus;
}