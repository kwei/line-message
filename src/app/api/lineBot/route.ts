import {NextApiResponse} from "next"
import {Client, WebhookEvent} from "@line/bot-sdk"
import {NextResponse} from "next/server"
import {Configuration, OpenAIApi} from "openai"

const ALL_CONSUMPTION_TYPE = [
    "food",
    "clothing",
    "housing",
    "transportation",
    "education",
    "entertainment",
    "daily",
    "salary",
    "bonus",
    "investment",
    "repayment",
    "subsidy",
    "feedback",
    "medical",
    "advancePayment",
    "refund",
    "other"
]

const openAIApiConfig = new Configuration({
    apiKey: process.env.OPEN_AI_API_KEY ?? ''
})

const openai = new OpenAIApi(openAIApiConfig)

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
    channelSecret: process.env.LINE_CHANNEL_SECRET ?? '',
}

const client = new Client(config)

export async function POST(req: Request, _: NextApiResponse) {
    const body = await readStream(req.body)
    const events: WebhookEvent[] = JSON.parse(body).events
    try {
        await Promise.all(events.map(handleEvent))
        return NextResponse.json({ status: 'OK' })
    } catch (e) {
        return NextResponse.json({ status: 'FAIL', message: 'Internal Server Error: ' + e })
    }
}

async function handleEvent(event: WebhookEvent) {
    if (event.type === 'message') {
        const message = event.message
        if (message.type === 'text') {
            console.log("message: ", message.text)

            const matchRes = message.text.match(/\$([0-9]+) (.*)/g)
            console.log("matchRes: ", matchRes)

            if (matchRes) {
                const msg2gpt = `根據消費項目(${matchRes[1]})判斷消費類型，所有類型有 ${ALL_CONSUMPTION_TYPE.join(',')}，請擇一。`
                console.log("msg2gpt: ", msg2gpt)

                const completion = await openai.createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: msg2gpt }]
                }).then(res => {
                    if (res.status === 200) return res.data
                    return null
                }).catch(e => {
                    console.log(e)
                    return null
                })
                console.log("completion: ", completion)

                const gptRes = completion?.choices[0].message?.content
                console.log("gptRes: ", gptRes)

                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: `已幫您記錄至 https://line-bucket.vercel.app/Record，目前記錄的消費種類為${gptRes}，若需要更改請至網站進行調整。`
                })
            } else {
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '輸入的格式不太對喔，範例：$130 雞腿便當'
                })
            }
        }
    }
}

async function readStream(stream: ReadableStream | null): Promise<string> {
    if (!stream) return ''
    const reader = stream.getReader()
    let result = ''
    const decoder = new TextDecoder()
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        result += chunk
    }
    return result
}