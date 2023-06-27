import {NextApiResponse} from "next";
import {Client, WebhookEvent} from "@line/bot-sdk";
import {NextResponse} from "next/server";

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
    channelSecret: process.env.LINE_CHANNEL_SECRET ?? '',
}

const client = new Client(config)

export async function POST(req: Request, res: NextApiResponse) {
    console.log(1)
    const body2 = await req.body
    console.log(2, body2)
    // const events: WebhookEvent[] = bodyObj.events
    const events: WebhookEvent[] = []
    console.log(3, events)
    try {
        await Promise.all(events.map(handleEvent))
        console.log(4)
        return NextResponse.json({ status: 'OK' })
    } catch (e) {
        console.log(5, e)
        return NextResponse.json({ error: 'Internal Server Error: ' + e })
    }
}

async function handleEvent(event: WebhookEvent) {
    console.log(event)
}