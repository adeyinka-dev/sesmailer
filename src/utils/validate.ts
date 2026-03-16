import { sendOptions } from '../mailer';

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateSendOptions(options: sendOptions) {
  if (!options.to || !isEmail(options.to)) {
    throw new Error("sesmailer: 'to' must be a valid email address");
  }
  if (!options.subject) throw new Error("sesmailer: 'subject' must not be empty");
  if (!options.html) throw new Error("sesmailer: 'html' must not be empty");
}
