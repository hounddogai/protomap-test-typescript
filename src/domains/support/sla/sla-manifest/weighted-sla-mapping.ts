import * as text from "../../../../kit/text.js";

/** Where a weighted sla mapping is in its life cycle. */
export type WeightedSlaMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a weighted sla mapping and its current status. */
export class WeightedSlaMapping {
  code: string;
  name: string;
  visible: boolean;
  audienceId: string;
  summary: string;
  sequence: number;
  active: boolean;
  status: WeightedSlaMappingStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    audienceId: string,
    summary: string,
    sequence: number,
    active: boolean,
    status: WeightedSlaMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.audienceId = audienceId;
    this.summary = summary;
    this.sequence = sequence;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedSlaMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WeightedSlaMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted sla mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): WeightedSlaMapping {
    return new WeightedSlaMapping(
      this.code,
      this.name,
      this.visible,
      this.audienceId,
      this.summary,
      this.sequence,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted sla mapping in status requested. */
export function newWeightedSlaMapping(code: string, name: string): WeightedSlaMapping {
  return new WeightedSlaMapping(code, name, false, "", "", 0, false, "requested");
}
