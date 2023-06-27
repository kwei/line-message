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
    console.log(3, await readStream(body2))
    // const events: WebhookEvent[] = bodyObj.events
    const events: WebhookEvent[] = []
    console.log(4, events)
    try {
        await Promise.all(events.map(handleEvent))
        console.log(5)
        return NextResponse.json({ status: 'OK' })
    } catch (e) {
        console.log(6, e)
        return NextResponse.json({ error: 'Internal Server Error: ' + e })
    }
}

async function handleEvent(event: WebhookEvent) {
    console.log(event)
}

async function readStream(stream: ReadableStream | null): Promise<string> {
    if (!stream) return ''
    const reader = stream.getReader()
    let result = ''
    const decoder = new TextDecoder()

    while (true) {
        const { done, value } = await reader.read()
        console.log(done, value)
        if (done) break

        const chunk = decoder.decode(value)
        result += chunk
    }

    return result
}