import * as text from "../../../../kit/text.js";

/** Where a weighted queue mapping is in its life cycle. */
export type WeightedQueueMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One weighted queue mapping, with what the planners need to act on it. */
export class WeightedQueueMapping {
  code: string;
  label: string;
  campaignRef: string;
  channel: string;
  visible: boolean;
  quantity: number;
  status: WeightedQueueMappingStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    channel: string,
    visible: boolean,
    quantity: number,
    status: WeightedQueueMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.visible = visible;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedQueueMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedQueueMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted queue mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted queue mapping"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): WeightedQueueMapping {
    return new WeightedQueueMapping(
      this.code,
      this.label,
      this.campaignRef,
      this.channel,
      this.visible,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted queue mapping in status proposed. */
export function newWeightedQueueMapping(code: string, label: string): WeightedQueueMapping {
  return new WeightedQueueMapping(code, label, "", "", false, 0, "proposed");
}
