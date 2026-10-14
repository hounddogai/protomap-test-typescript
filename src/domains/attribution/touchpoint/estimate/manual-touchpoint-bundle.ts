import * as text from "../../../../kit/text.js";

/** Where a manual touchpoint bundle is in its life cycle. */
export type ManualTouchpointBundleStatus = "created" | "validated" | "published" | "retired";

/** The record of a manual touchpoint bundle and its current status. */
export class ManualTouchpointBundle {
  code: string;
  label: string;
  visible: boolean;
  campaignRef: string;
  sendAt: number;
  budget: number;
  weight: number;
  retries: number;
  status: ManualTouchpointBundleStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    campaignRef: string,
    sendAt: number,
    budget: number,
    weight: number,
    retries: number,
    status: ManualTouchpointBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.campaignRef = campaignRef;
    this.sendAt = sendAt;
    this.budget = budget;
    this.weight = weight;
    this.retries = retries;
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

  canMoveTo(next: ManualTouchpointBundleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualTouchpointBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual touchpoint bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.weight - this.budget) * 100) / 100;
  }

  copy(): ManualTouchpointBundle {
    return new ManualTouchpointBundle(
      this.code,
      this.label,
      this.visible,
      this.campaignRef,
      this.sendAt,
      this.budget,
      this.weight,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual touchpoint bundle in status created. */
export function newManualTouchpointBundle(code: string, label: string): ManualTouchpointBundle {
  return new ManualTouchpointBundle(code, label, false, "", 0, 0, 0, 0, "created");
}
