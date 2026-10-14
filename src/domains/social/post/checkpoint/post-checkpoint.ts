/**
 * The post checkpoint records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post checkpoint is in its life cycle. */
export type PostCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** One post checkpoint, with what the planners need to act on it. */
export class PostCheckpoint {
  code: string;
  label: string;
  conversionRate: number;
  name: string;
  contactEmail: string;
  channel: string;
  phone: string;
  openRate: number;
  visible: boolean;
  status: PostCheckpointStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    name: string,
    contactEmail: string,
    channel: string,
    phone: string,
    openRate: number,
    visible: boolean,
    status: PostCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.name = name;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.phone = phone;
    this.openRate = openRate;
    this.visible = visible;
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

  canMoveTo(next: PostCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"post checkpoint"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round(this.conversionRate * this.openRate * 100) / 100;
  }

  copy(): PostCheckpoint {
    return new PostCheckpoint(
      this.code,
      this.label,
      this.conversionRate,
      this.name,
      this.contactEmail,
      this.channel,
      this.phone,
      this.openRate,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a post checkpoint in status requested. */
export function newPostCheckpoint(code: string, label: string): PostCheckpoint {
  return new PostCheckpoint(code, label, 0, "", "", "", "", 0, false, "requested");
}
