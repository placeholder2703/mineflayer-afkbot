// DEFAULTS
const mineflayer = require('mineflayer')
const fs = require('fs')
const args = process.argv.slice(2)

let bot = null
let server = 'localhost'
let prt = 8080
let ver = false
let name = 'aterclanker6767'

let move = false
let state = "DISCONNECTED"
let joinTime = null

let autorun = null

// FUNCTIONS
function startBot() {
  bot = mineflayer.createBot({
    host: server,
    port: prt,
    username: name,
    version: ver})
  state = "CONNECTING"
  bot.on('spawn', () => {
    state = "CONNECTED"
    joinTime = Date.now()
    console.log("Bot joined successfully")
    if (autorun) {
      chatDelayed(JSON.parse(fs.readFileSync(autorun, 'utf8')), 200)
      console.log('Executed auto run script ', autorun)}
    AFKMovement = setInterval(() => {
      if (!move) return
      const yaw = Math.random() * Math.PI * 2
      const pitch = (Math.random() * 0.3) - 0.15
      bot.look(yaw, pitch, true)
      bot.setControlState('forward', true)
      if (Math.random() < 0.3) bot.setControlState('jump', true)
      setTimeout(() => {
        bot.setControlState('forward', false)
        bot.setControlState('jump', false)
      }, Math.random() * 600 + 300) // 300–900ms
    }, 6000)})
  bot.on('kicked', reason => {
    console.log("Kicked:", reason)})
  bot.on('error', err => {
    console.log("Error:", err)})
  bot.on('end', () => {
    joinTime = null
    state = "DISCONNECTED"
    console.log("Bot disconnected.")})}
function sec2up(time) {
  const seconds = time;
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  let str = "";
  if (d > 0) str += `${d}d `;
  if (h > 0) str += `${h}h `;
  if (m > 0) str += `${m}m `;
  str += `${s}s`;
  return str.trim()}
function parseVersion(ver) {
  const verRegex = /^1\.(0|[1-9]\d?)(\.(0|[1-9]\d?))?$/
  return verRegex.test(ver) ? ver : false}
async function chatDelayed(array, ms) {
 for (const msg of array) {
   bot.chat(msg)
   await new Promise(r => setTimeout(r, ms))}}

// CLI FLAGS
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '-s':
      server = args[++i]
      break
    case '-p':
      prt = parseInt(args[++i])
      break
    case '-n':
      name = args[++i]
      break
    case '-v':
      ver = args[++i] === 'false' ? false : parseVersion(args[i])
      break
    case '-j':
      setImmediate(startBot)
      break
    case '-a':
      autorun = args[++i]
      break}}

// TERMINAL INPUT
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout})
rl.on('line', (input) => {
  try {
    if (input === '.stop') { process.exit(0) }
    if (input === '.join') { startBot() }
    if (input === '.afktoggle') {
      move = !move
      console.log("AutoAFK toggled: " + move)}
    if (input.split(' ')[0] === '.autorun') {
      if (!input.split(' ')[1]) {
        autorun = null
      } else {
        if (fs.existsSync(input.split(' ')[1])) {
          autorun = input.split(' ')[1]
        } else { console.log('Nonexistent file: ', input.split(' ')[1]) }}}
    if (input.split(' ')[0] === '.server') {
      const address = input.split(' ')[1]
      server = address.split(':')[0]
      prt = parseInt(address.split(':')[1])
      console.log(`Changed address to ${server}:${prt}`)}
    if (input.split(' ')[0] === '.ver') {
      if (ver === 'false') {
        ver = false
      } else {
        ver = parseVersion(input.split(' ')[1])}
      console.log(`Changed version to ${ver}`)}
    if (input.split(' ')[0] === '.name') {
      name = input.split(' ')[1] ? input.split(' ')[1] : name
      console.log('Changed username to ' + name)}
    if (input === '.status') { console.log(
      `Process Uptime: ${sec2up(process.uptime())}\n` +
      `Server Uptime:  ${joinTime ? sec2up((Date.now()-joinTime)/1000) : state}\n` +
      `Username:       ${name}\n` +
      `Server:         ${server}:${prt}\n` +
      `Version:        ${ver ? ver : 'AUTO'}\n` +
      `AFK toggle:     ${move}\n` +
      `Run on join:    ${autorun}\n` +
      `Status:         ${state}`)}
    if (input.split(' ')[0] === '.help') {
      console.log(
        `COMMANDS          DESCRIPTION                DEFAULT\n` +
        `.help             Outputs this whole thing   NONE\n` +
        `.stop             Just like Ctrl-C           NONE\n` +
        `.join             Joins the server           NONE\n` +
        `.status           Shows status, info         NONE\n` +
        `.afktoggle        Toggles AFK movement       ON\n` +
        `.autorun <file>   Run script on spawn(200ms) null(off)\n` +
        `.server <ip:port> Change server address      localhost:8080\n` +
        `.ver <ver>        Change version(blank=auto) false(auto)\n` +
        `.name <name>      Change the bot's name      aterclanker6767\n` +
        `----------------REQUIRES TO BE CONNECTED----------------\n` +
        `.leave            Leaves the server          NONE\n` +
        `.rejoin <ms>      Rejoins the server         2000\n` +
        `----------------REQUIRES TO BE LOADED IN----------------\n` +
        `.pos              Shows current location     NONE\n` +
        `.run <file> <ms>  Run script from a file     script.json 500\n\n` +
        `----------------------CLI FLAGS-------------------------\n` +
        `-s <ip>           Change server ip           localhost\n` +
        `-p <port>         Change server port         8080\n` +
        `-n <name>         Change the bot's name      aterclanker6767\n` +
        `-v <version>      Change version             false(auto)\n` +
        `-j                Autojoin when initialized  NONE\n` +
        `-a <file>         Run script on spawn(200ms) null(off)`)}

    if (!bot) return
    if (input === '.leave') {
      clearInterval(AFKMovement)
      bot.quit()}
    if (input.split(' ')[0] === '.rejoin') {
      clearInterval(AFKMovement)
      bot.quit()
      setTimeout(() =>
        startBot(),
        parseInt(input.split(' ')[1] || 2000))}

    if (!bot.entity) return
    if (input === '.pos') {
      const p = bot.entity.position
      const yaw = bot.entity.yaw
      const pitch = bot.entity.pitch
      console.log(
        `${p.x.toFixed(2)} ${p.y.toFixed(2)} ${p.z.toFixed(2)} | ${yaw.toFixed(2)} ${pitch.toFixed(2)}`
      )}
    if (input.split(' ')[0] === '.run') {
      const fileName = input.split(' ')[1] ? input.split(' ')[1] : 'script.json'
      if (!fs.existsSync(fileName)) {
        console.log("Nonexistent file '" + fileName + "'")
        return}
      const script = JSON.parse(fs.readFileSync(fileName, 'utf8'))
      chatDelayed(script, parseInt(input.split(' ')[2] || 500))}
    if (input[0] !== '.') { bot.chat(input) }
  } catch (e) { console.log(e.message) }})
console.log('Bot initalized, .help for a list of commands')
