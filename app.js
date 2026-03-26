// DOM
const username = document.getElementById("username");
const password = document.getElementById("password");
const auth = document.getElementById("auth");
const app = document.getElementById("app");
const home = document.getElementById("home");
const appPage = document.getElementById("appPage");
const upload = document.getElementById("upload");
const apps = document.getElementById("apps");
const trending = document.getElementById("trending");
const search = document.getElementById("search");
const fileInput = document.getElementById("fileInput");
const appName = document.getElementById("appName");
const appIcon = document.getElementById("appIcon");

// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyApLpqXTnuPsT5rdDG04jLMlW-a0ERkbpM",
  databaseURL: "https://stockgameultra-default-rtdb.firebaseio.com",
  storageBucket: "stockgameultra.firebasestorage.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

let currentUser = localStorage.getItem("user");
let currentTab = "foryou";

if (currentUser) startApp();

// AUTH
function signup(){
  if(!username.value || !password.value){
    alert("Fill all fields");
    return;
  }

  db.ref("users/"+username.value).once("value").then(s=>{
    if(s.exists()){
      alert("User already exists");
    } else {
      db.ref("users/"+username.value).set({
        password: password.value
      });
      alert("Account created!");
    }
  });
}

function login(){
  if(!username.value || !password.value){
    alert("Enter username & password");
    return;
  }

  db.ref("users/"+username.value).once("value").then(s=>{
    let d = s.val();

    if(d && d.password === password.value){
      localStorage.setItem("user", username.value);
      currentUser = username.value;
      startApp();
    } else {
      alert("Wrong username or password");
    }
  });
}

function startApp(){
  auth.style.display="none";
  app.style.display="block";
  loadApps();
}

// LOGOUT / DELETE
function logout(){
  localStorage.removeItem("user");
  location.reload();
}

function deleteAccount(){
  db.ref("users/"+currentUser).remove();
  logout();
}

// LOAD APPS
function loadApps(){
  db.ref("apps").on("value",snap=>{
    let data=snap.val();
    if(!data) return;

    let arr=Object.entries(data);
    renderApps(arr);
    showTrending(arr);
  });
}

// RENDER
function renderApps(arr){
  apps.innerHTML="";

  if(currentTab==="top"){
    arr.sort((a,b)=>(b[1].downloads||0)-(a[1].downloads||0));
  }

  arr.forEach(([id,app])=>{
    apps.innerHTML+=`
      <div class="appCard" onclick="openApp('${id}')">
        <img src="${app.icon}">
        <p>${app.name}</p>
        ${app.verified?"✅":""}
      </div>`;
  });
}

// TRENDING
function showTrending(arr){
  trending.innerHTML="";
  arr.sort((a,b)=>(b[1].downloads||0)-(a[1].downloads||0));

  arr.slice(0,5).forEach(([id,a])=>{
    trending.innerHTML+=`<img src="${a.icon}" onclick="openApp('${id}')">`;
  });
}

// OPEN APP
function openApp(id){
  db.ref("apps/"+id).once("value").then(s=>{
    let a=s.val();

    home.style.display="none";
    appPage.style.display="block";

    appPage.innerHTML=`
      <img src="${a.icon}" width="100">
      <h2>${a.name} ${a.verified?"✅":""}</h2>

      <button onclick="scanAndInstall('${id}','${a.url}')">Install</button>

      <div class="progress"><div id="bar"></div></div>

      <h3>Screenshots</h3>
      <div class="scroll">
        ${(a.screenshots||[]).map(s=>`<img src="${s}">`).join("")}
      </div>

      ${currentUser==="Virat"?`<button onclick="verify('${id}')">Verify</button>`:""}

      <button onclick="back()">Back</button>
    `;
  });
}

// SCAN SYSTEM
function scanAndInstall(id,url){
  let risky = Math.random()<0.4;

  if(!risky){
    animateInstall(id,url);
  } else {
    let c=confirm("⚠️ Play Protect Warning\nDownload anyway?");
    if(c) animateInstall(id,url);
  }
}

// INSTALL
function animateInstall(id,url){
  let bar=document.getElementById("bar");
  bar.style.width="0%";

  let w=0;
  let i=setInterval(()=>{
    w+=5;
    bar.style.width=w+"%";

    if(w>=100){
      clearInterval(i);
      window.open(url);
      db.ref("apps/"+id+"/downloads").transaction(n=>(n||0)+1);
    }
  },100);
}

// VERIFY ADMIN
function verify(id){
  if(currentUser==="Virat"){
    db.ref("apps/"+id+"/verified").set(true);
    alert("Verified!");
  }
}

// UPLOAD
function uploadAPK(){
  let file=fileInput.files[0];

  if(!file || !appName.value){
    alert("Fill all fields");
    return;
  }

  let ref=storage.ref("apks/"+file.name);

  ref.put(file).then(s=>{
    s.ref.getDownloadURL().then(url=>{
      db.ref("apps").push({
        name:appName.value,
        icon:appIcon.value,
        url,
        downloads:0,
        verified:false,
        screenshots:[appIcon.value]
      });
      alert("Uploaded!");
    });
  });
}

// SEARCH
function searchApps(){
  let v=search.value.toLowerCase();
  document.querySelectorAll(".appCard").forEach(c=>{
    c.style.display=c.innerText.toLowerCase().includes(v)?"block":"none";
  });
}

// NAV
function showHome(){
  home.style.display="block";
  upload.style.display="none";
  appPage.style.display="none";
}

function showUpload(){
  home.style.display="none";
  upload.style.display="block";
}

function back(){
  showHome();
}

// TABS
function switchTab(tab){
  currentTab=tab;
  loadApps();
}
