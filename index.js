require('dotenv').config();
.catch(err => { error(err, 'MongoDB error'); process.exit(1); });


// Получить прогноз
async function getWeather(lat, lon) {
const url = 'https://api.openweathermap.org/data/2.5/weather';
const params = {
lat, lon, appid: weatherApiKey, units: 'metric', lang: 'ru'
};
const response = await axios.get(url, { params });
return response.data;
}


// Форматировать сообщение прогноза
function formatWeather(data) {
const { name, weather, main, wind } = data;
return `Погода в ${name}:\n${weather[0].description}, температура ${main.temp}°C (ощущается как ${main.feels_like}°C), ветер ${wind.speed} м/с.`;
}


// Команды
bot.onText(/\/start/, msg => {
bot.sendMessage(msg.chat.id, `Привет!\nКоманды:\n/subscribe - подписаться\n/unsubscribe - отписаться\n/list - список подписок`);
});


bot.onText(/\/unsubscribe/, async msg => {
const sub = await Subscription.findOneAndDelete({ chatId: msg.chat.id });
bot.sendMessage(msg.chat.id, sub ? 'Вы отписались.' : 'Вы не были подписаны.');
});


bot.onText(/\/list/, async msg => {
const subs = await Subscription.find({ chatId: msg.chat.id });
if (!subs.length) return bot.sendMessage(msg.chat.id, 'Нет активных подписок.');
let text = 'Ваши подписки:\n';
for (const sub of subs) {
const weather = await getWeather(sub.location.latitude, sub.location.longitude);
text += `\nГород: ${weather.name}\nВремя (UTC): ${sub.notificationTime}\n`;
}
bot.sendMessage(msg.chat.id, text);
});


bot.onText(/\/subscribe/, msg => {
userStates[msg.chat.id] = { step: 'awaiting_location' };
bot.sendMessage(msg.chat.id, 'Пришлите вашу геолокацию.');
});


bot.on('location', msg => {
const state = userStates[msg.chat.id];
if (state?.step === 'awaiting_location') {
state.step = 'awaiting_time';
state.location = msg.location;
bot.sendMessage(msg.chat.id, 'Введите время в формате HH:MM (UTC).');
}
});


bot.on('message', async msg => {
if (!msg.text || msg.text.startsWith('/')) return;
const state = userStates[msg.chat.id];
if (state?.step === 'awaiting_time') {
if (!/^\d{2}:\d{2}$/.test(msg.text)) {
return bot.sendMessage(msg.chat.id, 'Формат времени должен быть HH:MM.');
}
await Subscription.findOneAndUpdate(
{ chatId: msg.chat.id },
{
chatId: msg.chat.id,
username: msg.chat.username,
location: state.location,
notificationTime: msg.text,
isActive: true,
},
{ upsert: true, new: true }
);
delete userStates[msg.chat.id];
bot.sendMessage(msg.chat.id, `Вы подписаны на прогноз в ${msg.text} UTC.`);
}
});


// Рассылка прогноза по расписанию
cron.schedule('* * * * *', async () => {
const nowUTC = new Date().toISOString().slice(11, 16);
const subs = await Subscription.find({ notificationTime: nowUTC, isActive: true });
for (const sub of subs) {
try {
const data = await getWeather(sub.location.latitude, sub.location.longitude);
const message = formatWeather(data);
await bot.sendMessage(sub.chatId, '🌤️ Ваш прогноз:\n' + message);
} catch (err) {
error(err, 'Ошибка при отправке прогноза');
}
}
});


// Запуск Express
app.listen(port, () => info(`Express на порту ${port}`));