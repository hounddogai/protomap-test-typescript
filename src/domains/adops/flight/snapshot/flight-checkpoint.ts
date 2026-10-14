import * as text from "../../../../kit/text.js";

/** Where a flight checkpoint is in its life cycle. */
export type FlightCheckpointStatus = "created" | "validated" | "published" | "retired";

/** The record of a flight checkpoint and its current status. */
export class FlightCheckpoint {
  code: string;
  label: string;
  priority: number;
  name: string;
  channel: string;
  status: FlightCheckpointStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    name: string,
    channel: string,
    status: FlightCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.name = name;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FlightCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"flight checkpoint"} ${this.code}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): FlightCheckpoint {
    return new FlightCheckpoint(this.code, this.label, this.priority, this.name, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a flight checkpoint in status created. */
export function newFlightCheckpoint(code: string, label: string): FlightCheckpoint {
  return new FlightCheckpoint(code, label, 0, "", "", "created");
}
