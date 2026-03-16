import * as nodemailer from 'nodemailer';
import { SESMailerConfig } from './config';

export function createSESTransport(config: SESMailerConfig) {
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
    pool: true,
    maxConnections: 5,
  });
  return transporter;
}
