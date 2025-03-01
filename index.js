require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const CHANNEL_ID = process.env.CHANNEL_ID; 
const BOT_TOKEN = process.env.BOT_TOKEN; 

app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});



const images = [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbgZ__LdsiVoCkP52yuMeVa0tCcYl-iB0Auw&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4tppsTiYKRWB0jqJ1PCKofvXFewUOS2yOvg&s',
    'https://preview.redd.it/%D8%AA%D9%85-%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9-%D8%A7%D9%84%D9%83%D8%B1%D8%B4-%D8%A8%D9%86%D8%AC%D8%A7%D8%AD-v0-3bomrdtd4dpa1.jpg?width=1080&crop=smart&auto=webp&s=9b7988a29aae0c817b143b0810b0b4e136cfa895',
    'https://media.tenor.com/71-zPuxWISIAAAAe/%D8%AA%D9%85-%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9-%D8%A7%D9%84%D9%83%D8%B1%D8%B4-%D8%A8%D9%86%D8%AC%D8%A7%D8%AD-good-morning.png',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtBHB0d48-SGSlHrLHrsmgaYGObQMXq-7_og&s',
    'https://i.pinimg.com/736x/0a/6f/8d/0a6f8d77b9bb7e56bf4a494cef9b3ff9.jpg',
    'https://pbs.twimg.com/media/Fr6hCm1X0AAe_LS.jpg',
    'https://i.pinimg.com/736x/47/79/e6/4779e6e3c501c0cd0de16e128293a5e7.jpg',
    'https://pbs.twimg.com/media/EXB3uq0XQAEvMIo.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ723WMh9HCLtUYeOM6gQ8pTARRpc1WIz3J8A&s',
    'https://i.pinimg.com/474x/7e/cd/01/7ecd01e09b58d8a36e04b3c090cbc550.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSVCTQ6W9R-YNfWfAMfKarTuOUL8NswhVB9A&s',
    'https://pbs.twimg.com/media/GIZjKFCXYAABS3i.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9ZBkRJ-p37hr6veW_J9kGvjzi-F-K1GEXGQ&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQE5zUFiCoA-Bi4T79gRFTZeKGzpCTniYnrGA&s',
    'https://preview.redd.it/ramadan-new-collection-2024-v0-t5p8jvhiepoc1.jpg?width=640&crop=smart&auto=webp&s=9e9410ba5da47e55ad42fc1339ec252523a499ad',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQw26j5AQFcK1q6TRyyCqUeolm5VlwNn9xE8w&s',
    'https://i.redd.it/cjshkftawwoc1.jpeg',
    'https://preview.redd.it/thread-%D8%AA%D9%85-%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9-%D8%A7%D9%84%D9%83%D8%B1%D8%B4-%D8%A8%D9%86%D8%AC%D8%A7%D8%AD-v0-lis3z96d0joc1.jpeg?width=720&format=pjpg&auto=webp&s=0a1163f2a11c37e1149832f0115a340d516738db',
    'https://www.meme-arsenal.com/memes/0c6bf3215d19acffcbe63bc339c2bd7c.jpg',
    'https://preview.redd.it/the-last-%D8%AA%D9%85-%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9-%D8%A7%D9%84%D9%83%D8%B1%D8%B4-%D8%A8%D9%86%D8%AC%D8%A7%D8%AD-v0-uynwte8n7itc1.jpeg?width=640&crop=smart&auto=webp&s=63b11ca8f0951b4f49fb3c5c8f2325a8029465a5',
];

let currentDay = 0;

async function getMaghribTime() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity/${today}?country=EG&city=Cairo`);
        return response.data.data.timings.Maghrib;
    } catch (error) {
        console.error('خطأ في جلب وقت صلاة المغرب:', error);
        return null;
    }
}

function add30Minutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    let newMinutes = minutes + 30;
    let newHours = hours;
    if (newMinutes >= 60) {
        newMinutes -= 60;
        newHours += 1;
    }
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    const maghribTime = await getMaghribTime();
    if (!maghribTime) return;
    
    const postTime = add30Minutes(maghribTime);
    
    cron.schedule(`0 ${maghribTime.split(':')[1]} ${maghribTime.split(':')[0]} * * *`, () => {
        const channel = client.channels.cache.get(CHANNEL_ID);
        if (channel && currentDay < 29) {
            channel.send('(اللهم لكَ صمت وعلى رزقك أفطرت، ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله)');
            currentDay++;
        }
    }, { timezone: 'Africa/Cairo' });

    cron.schedule(`0 ${postTime.split(':')[1]} ${postTime.split(':')[0]} * * *`, () => {
        const channel = client.channels.cache.get(CHANNEL_ID);
        if (channel && currentDay <= 29) {
            channel.send(images[currentDay % images.length]);
        }
    }, { timezone: 'Africa/Cairo' });

    console.log(`رسالة الإفطار سترسل عند ${maghribTime}، والصورة عند ${postTime}.`);
});

client.login(BOT_TOKEN);
