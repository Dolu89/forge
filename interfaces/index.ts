import { RelayDB } from "~/db/db";
import { DockerStatus } from "enums";

export interface RelayExtended extends RelayDB {
    status: DockerStatus;
}

export interface DockerCreated {
    port: number;
    path: string;
}