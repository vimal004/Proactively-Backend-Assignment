import { google, calendar_v3 } from "googleapis";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

interface BookingDetails {
  date: string;
  startTime: string;
  endTime: string;
  userEmail: string;
  speakerEmail: string;
}

class GoogleService {
  private oauth2Client: any;

  constructor() {
    // Validate environment variables
    this.validateCredentials();

    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    // Set credentials with refresh token
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
  }

  // Validate required environment variables
  private validateCredentials(): void {
    const requiredEnvVars = [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REFRESH_TOKEN",
      "EMAIL_USER",
    ];

    requiredEnvVars.forEach((varName) => {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    });
  }

  // Refresh the access token
  private async refreshAccessToken(): Promise<any> {
    try {
      console.log("Attempting to refresh access token...");
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      console.log("Access token refreshed successfully");
      return credentials;
    } catch (error: any) {
      console.error("Access Token Refresh Error:", error);
      console.error("Detailed Error:", {
        message: error.message,
        code: error.code,
        response: error.response ? error.response.data : "No response data",
      });
      throw new Error(`Token Refresh Failed: ${error.message}`);
    }
  }

  // Create a calendar event
  public async createCalendarEvent(
    bookingDetails: BookingDetails
  ): Promise<string> {
    try {
      // Explicitly refresh access token
      const credentials = await this.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);

      // Create Google Calendar service
      const calendar: calendar_v3.Calendar = google.calendar({
        version: "v3",
        auth: this.oauth2Client,
      });

      // Precise time handling
      const startDateTime = new Date(
        `${bookingDetails.date}T${bookingDetails.startTime}:00+05:30`
      );
      const endDateTime = new Date(
        `${bookingDetails.date}T${bookingDetails.endTime}:00+05:30`
      );

      const event: calendar_v3.Schema$Event = {
        summary: `Speaking Session`,
        description: `Booked Speaking Session`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        attendees: [
          { email: bookingDetails.userEmail },
          { email: bookingDetails.speakerEmail },
        ],
      };

      // Insert event into calendar
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });

      return response.data.htmlLink!;
    } catch (error: any) {
      console.error("Comprehensive Google Calendar Error:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        response: error.response ? error.response.data : "No response data",
      });
      throw new Error(`Calendar Event Creation Failed: ${error.message}`);
    }
  }
}

export default GoogleService;
