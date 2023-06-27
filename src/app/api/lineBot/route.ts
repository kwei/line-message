import {NextApiResponse} from "next"
import {Client, WebhookEvent} from "@line/bot-sdk"
import liff from "@line/liff"
import {NextResponse} from "next/server"
import {Configuration, OpenAIApi} from "openai"
import { MongoClient } from "mongodb"

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

const MONGO_DB_URI = process.env.MONGO_DB_URI ?? ''

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

            const matchRes = message.text.match(/\$([0-9]+) (.*)/)
            const res2ClientText: { type: 'text', text: string } = {
                type: 'text',
                text: ''
            }

            if (matchRes) {
                const msg2gpt = `根據消費項目(${matchRes[2]})判斷消費類型，所有類型有 ${ALL_CONSUMPTION_TYPE.join(',')}，請擇一。`

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

                const gptRes = completion?.choices[0].message?.content

                if (gptRes) {
                    const mongodbClient = new MongoClient(MONGO_DB_URI)
                    const db = mongodbClient.db('spendingRecord')
                    const collections = db.collection('meta')
                    const date = new Date()
                    const _year = date.getFullYear()
                    const _month = date.getMonth()+1
                    const _day = date.getDate()
                    const _hour = date.getHours()
                    const _min = date.getMinutes()

                    const userProfile = await client.getProfile(event.source.userId ?? '')

                    fetch('https://liff.line.me/1661546903-vPk3jXaw').then(res => {
                        console.log(res)
                    })

                    const _data = {
                        "userId": userProfile.userId,
                        "date": `${_year}/${_month > 10 ? _month : '0'+_month}/${_day > 10 ? _day : '0'+_day}`,
                        "time": `${_hour > 10 ? _hour : '0'+_hour}:${_min > 10 ? _min : '0'+_min}`,
                        "item": matchRes[2],
                        "type": gptRes,
                        "price": Number(matchRes[1])
                    }
                    console.log("To be saved: ", _data)
                    await collections.insertOne(_data).then((data) => {
                        console.log('inserted data: ', data)
                        res2ClientText.text = `目前記錄的消費種類為 ${gptRes}，若需要更改請至網站( https://line-bucket.vercel.app/Record )進行調整。`
                    }).catch((e) => {
                        console.log('failed to insert data: ', e)
                        res2ClientText.text ='無法成功新增該筆記錄，您可以去問問開發者是不是在睡覺 :)'
                    })
                } else {
                    console.log("gptRes: ", gptRes)
                    res2ClientText.text = '我看不懂您消費的項目是啥鬼 :('
                }
            } else {
                console.log("matchRes: ", matchRes)
                res2ClientText.text = '輸入的格式不太對喔，貼心的我給您一個範例：$130 雞腿便當'
            }
            await client.replyMessage(event.replyToken, [res2ClientText])
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
