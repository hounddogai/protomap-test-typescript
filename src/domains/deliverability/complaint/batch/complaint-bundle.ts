import * as text from "../../../../kit/text.js";

/** Where a complaint bundle is in its life cycle. */
export type ComplaintBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A complaint bundle. Its code is unique within a tenant. */
export class ComplaintBundle {
  code: string;
  name: string;
  channel: string;
  ownerId: string;
  maximum: number;
  conversionRate: number;
  margin: number;
  audienceId: string;
  variant: string;
  sequence: number;
  durationMinutes: number;
  status: ComplaintBundleStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    ownerId: string,
    maximum: number,
    conversionRate: number,
    margin: number,
    audienceId: string,
    variant: string,
    sequence: number,
    durationMinutes: number,
    status: ComplaintBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.ownerId = ownerId;
    this.maximum = maximum;
    this.conversionRate = conversionRate;
    this.margin = margin;
    this.audienceId = audienceId;
    this.variant = variant;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ComplaintBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: ComplaintBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round(this.sequence * this.maximum * 100) / 100;
  }

  copy(): ComplaintBundle {
    return new ComplaintBundle(
      this.code,
      this.name,
      this.channel,
      this.ownerId,
      this.maximum,
      this.conversionRate,
      this.margin,
      this.audienceId,
      this.variant,
      this.sequence,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a complaint bundle in status proposed. */
export function newComplaintBundle(code: string, name: string): ComplaintBundle {
  return new ComplaintBundle(code, name, "", "", 0, 0, 0, "", "", 0, 0, "proposed");
}
