import { getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import emailjs from '@emailjs/browser';

interface NotificationPayload {
  title: string;
  message: string;
  userEmail?: string;
  userName?: string;
}

export async function sendNotification(payload: NotificationPayload) {
  try {
    const snap = await getDoc(doc(db, 'integrations', 'workspace'));
    if (!snap.exists()) return;
    
    const data = snap.data();
    
    // Slack Webhook
    if (data.slackWebhook) {
      try {
        await fetch(data.slackWebhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-type': 'application/x-www-form-urlencoded'
          },
          body: `payload=${JSON.stringify({ 
            text: `*${payload.title}*\n${payload.message}` 
          })}`
        });
      } catch (e) {
        console.error("Slack notification failed", e);
      }
    }
    
    // Email JS
    if (data.isEmailEnabled && data.emailServiceId && data.emailTemplateId && data.emailPublicKey && payload.userEmail) {
      try {
        await emailjs.send(
          data.emailServiceId,
          data.emailTemplateId,
          {
            to_email: payload.userEmail,
            to_name: payload.userName || 'Team Member',
            subject: payload.title,
            message: payload.message,
          },
          data.emailPublicKey
        );
      } catch (e) {
        console.error("Email notification failed", e);
      }
    }
    
  } catch (err) {
    console.error("Failed to send notification", err);
  }
}
