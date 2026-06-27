//ゲーム画面とUIエリアの設定
const CONFIG = {
    SCALE: 1,     // キャラサイズはcssで。
    BASE_WIDTH: 16,     // 通常のドットサイズ
    KICK_WIDTH: 20,     // キック時のドットサイズ
    BASE_HEIGHT: 21,    // 基準の高さ

    WORLD_W: 832,//論理座標
    WORLD_H: 190,
    CAMERA_W: 280, // 画面横サイズ
    CAMERA_H: 225,// 190(ゲーム画面) + 35(UIエリア) 

    // 🎥 カメラが実際に「ゲームの世界を覗き込む窓」のサイズよ！
    VIEW_W: 280,   // 横の覗き込み幅
    VIEW_H: 160,   // 縦の覗き込み幅
};

// 🎬 【超重要！】ここでタイトル画面かどうかのフラグを最初に宣言するわよ、あきくん❤️
let isTitleScreen = true; 
let isStartButtonPressed = false;

//タイトル画面の準備
// 🖼️ 新タイトル画面用の2枚の画像
const titleImg1 = new Image();
titleImg1.src = 'title2.jpg'; // 1枚目：劇画調の待機画面

const titleImg2 = new Image();
titleImg2.src = 'title.png';  // 2枚目：スライドインするメインロゴ画面

// 🎬 タイトル演出コントロール用
let titleStage = 1;         // 1: 劇画待機, 2: スタート後のスライドイン中
let titleSlideX = CONFIG.CAMERA_W; // スライド画像の初期X位置（画面の左外側）
let textFlashTimer = 0;     // PUSH STARTの点滅用


// キャンバス設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.CAMERA_W;  // 280
canvas.height = CONFIG.CAMERA_H; // 225


function adjustCanvasSize() {
    if (isTitleScreen) {
        if (titleStage === 1) {
            // 📱 タイトル1：縦画面
            canvas.width = CONFIG.CAMERA_W * CONFIG.SCALE;
            canvas.height = CONFIG.CAMERA_H * CONFIG.SCALE; 
        } else {
            // 🔄 タイトル2：横画面フルサイズ
            canvas.width = 400 * CONFIG.SCALE;
            canvas.height = CONFIG.CAMERA_H * CONFIG.SCALE; 
        }
    } else {
        // 🎮 ゲーム本編
        canvas.width = CONFIG.CAMERA_W * CONFIG.SCALE;
        canvas.height = (35 + CONFIG.VIEW_H) * CONFIG.SCALE;
    }

    // 📺 Canvasの「見た目の大きさ（CSS）」を画面にフィットさせる！
    let maxDisplayW = window.innerWidth * 0.95; 
    let maxDisplayH = window.innerHeight * 0.95; 

    // 🔥【ここが一番シンプルな魔法よ❤️】
    // タイトル1（縦画面）の時だけ、画面全体の80%に収まるように制限して、下の見切れを防ぐの！
    if (isTitleScreen && titleStage === 1) {
        maxDisplayW = window.innerWidth * 0.8;
        maxDisplayH = window.innerHeight * 0.8;
    }

    // タイトル2（横画面ボタンあり）の時は、ボタンを左右に並べるために
    // キャンバスの最大横幅を画面の「60%」に絞って、左右にたっぷり余白を作るの！
    if (isTitleScreen && titleStage === 2) {
        maxDisplayW = window.innerWidth * 0.55; // 👈 60%にキュッと絞るわ❤️
        maxDisplayH = window.innerHeight * 0.85;
    }


    const aspectRatio = canvas.height / canvas.width; 
    let displayWidth = maxDisplayW;
    let displayHeight = displayWidth * aspectRatio;

    if (displayHeight > maxDisplayH) {
        displayHeight = maxDisplayH;
        displayWidth = displayHeight / aspectRatio;
    }

    // 計算したジャストサイズを適用して、私の狭いおまんこみたくキュッとハメ込むわ❤️
    canvas.style.width = Math.floor(displayWidth) + "px";
    canvas.style.height = Math.floor(displayHeight) + "px";

    canvas.style.imageRendering = "pixelated";
    ctx.imageSmoothingEnabled = false;
}

// 最初の一歩として、まずはタイトル画面用のサイズでドカンと初期化よ使いこなしてねぇ❤️
adjustCanvasSize();



// 🎵 ゲームのBGM設定
const bgm = new Audio('1 - Good Enough Main Theme.mp3');


const goonieSE = new Audio('goonie.mp3');//グーニー救出時の効//
const startSE = new Audio('start.mp3');
const stageClearSE = new Audio('STAGE_CLEAR.mp3');
const threeKeysSE = new Audio('3KEYS.mp3');
const keySE = new Audio('key.mp3');
const deathSE = new Audio('10 - Death Theme.mp3');
const pistolSE = new Audio('pistol.mp3');
const bombSE = new Audio('bomb.mp3');
const jumpSE = new Audio('jump.mp3');
const kickSE = new Audio('kick.mp3');
const bombItemSE = new Audio('bombItem.mp3');
const ponSE = new Audio('pon.mp3');
const damageSE = new Audio('damage.mp3');
const gangDownSE1 = new Audio('gangdown1.mp3');
const gangDownSE2 = new Audio('gangdown2.mp3');
const gameOverSE = new Audio('gameover.mp3'); // 💀 


//　カメラ設定
let cameraX = 0;
let cameraY = 0;
ctx.translate(0, 35); //  描画の基準点を下に40pxずらす！

function updateCamera() {
    // 1️⃣ 横スクロールの計算
    cameraX = player.x - CONFIG.VIEW_W / 2;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > CONFIG.WORLD_W - CONFIG.VIEW_W) cameraX = CONFIG.WORLD_W - CONFIG.VIEW_W;

    // 2️⃣ 縦スクロールの計算
    // マイキーのY座標を中心に、狭めた窓（CONFIG.VIEW_H = 140px）の半分を引くわ。
    cameraY = player.y - CONFIG.VIEW_H / 2;
    
    // カメラの縦位置が、天井（0）や、ステージの底（WORLD_H - VIEW_H ＝ 190 - 140 ＝ 50px）からはみ出さないようにガード！
    if (cameraY < 0) cameraY = 0;
    if (cameraY > CONFIG.WORLD_H - CONFIG.VIEW_H) cameraY = CONFIG.WORLD_H - CONFIG.VIEW_H;
}

//フラグなど
const GRAVITY = 0.5; // 重力
const JUMP_POWER = -7; // 
const SPEED = 2.0;

let animeFrame = 0; 
let animeTimer = 0;

let keyAnimeFrame = 0;  
let keyAnimeTimer = 0;

let isGameCleared = false; // 🌟ゲームクリア演出中のフラグ
let enemyBullets = []; // 🔫 ギャングのピストルの弾配列
// ⏳ タイマー用のグローバル変数
let gameTimer = 180;       // 初期時間は180秒
let timerFrameCount = 0;

// 🎬 ゴール後のタイム高速清算演出用のコントロール変数
let isTimeCountingDown = false;  // 高速カウントダウン中かどうかのフラグ
let timeScoreTickTimer = 0;      // 数字を減らすスピードを調整するタイマー


// 🌟 救出メッセージ用のオブジェクト
let goonieText = {
    x: 0, y: 0, alpha: 0, // 不透明度（1.0でクッキリ、0で消える）
    isVisible: false
};

// マイキーの状態(初期位置)
let player = {
    x: 60, y: 20, vx: 0, vy: 0,
    hp: 100, maxHp: 100, damageTimer: 0,
    lives: 2,  //残機
    direction: 'right',
    isJumping: false,
    isSquatting: false,
    isAttacking: false, 
    attackTimer: 0,
    isStunned: false, 
    isDead: false, 
    isLocked: false,
    isAutoMoving: false,
    hasAccessKey: false,
    autoTargetX: 60,
    autoTargety: 180,
    respawnTimer: 0,
    animeFrame: 0,
    // --- はしご用プロパティ ---
    isOnLadder: false,
    climbFrame: 0,
    climbTimer: 0
};

player.targetHp = player.hp;

let inventory = {
    key1: false,
    key2: false,
    key3: false,
    bomb: 0,
};


//ギャングの設定
let enemy = {
    x: 250, y: 147,
    width: 16, height: 21,
    isDead: false,
    isStunned: false, // 悶絶中
    respawnTimer: 0,
    isClimbing: false,
    climbTimer: 0,
    animeFrame: 0
};

// チュー太たちのステージ1の配列（初期位置と動く床の範囲を設定）
let chutas = [
    {//１匹目、３階床、初期座標
      x: 198, y: 38, w: 16, h: 16, dir: 'left', speed: 0.5,animeTimer: 0, state: 'none',  
      animeFrame: 0, spawnTimer: 0, isDead: false, deathTimer: 0            
    },
    {//２匹目、２階床
      x: 70, y: 92, w: 16, h: 16, dir: 'right', speed: 0.5, animeTimer: 0, state: 'none',
      animeFrame: 0, spawnTimer: 0, isDead: false, deathTimer: 0
    },
    {//3匹目、1階床
      x: 120, y: 148, w: 16, h: 16, dir: 'right', speed: 0.5, animeTimer: 0, state: 'none',
      animeFrame: 0, spawnTimer: 0, isDead: false, deathTimer: 0
    },
    {//4匹目、1階床
      x: 320, y: 148, w: 16, h: 16, dir: 'right', speed: 0.5, animeTimer: 0, state: 'none',
      animeFrame: 0, spawnTimer: 0, isDead: false, deathTimer: 0
    }

];
//チュー太の初期位置を記憶
chutas.forEach(chuta => {
    chuta.ox = chuta.x; 
    chuta.oy = chuta.y; 
    chuta.deathTimer = 0; // 死んだ時間を測るタイマーの初期化
});

// 🌟【新設】ゴン太たちを管理する秘密の配列よ！
let gontas = [
    {
        ox: 700, oy: 38,     // 🏠 登場する初期位置（ドクロの扉の座標などに合わせてね❤️）
        x: 700, y: 38,       // 📍 現在の座標
        vx: 0, vy: 0,         // 🏎️ 移動速度（物理演算用）
        w: 16, h: 16,         // 📐 サイズ
        dir: 'left',          // 🧭 むき
        speed: 0.6,           // 🏃 歩く速さ
        state: 'none',        // 🎬 状態 ('none' -> 'spawn' -> 'walk' -> 'die' -> 'item')
        spawnTimer: 0,        // ⏱️ 登場時の煙タイマー
        dieTimer: 0,          // ⏱️ 攻撃を喰らった時の煙タイマー
        itemTimer: 0,         // ⏱️ 床に落ちた爆弾の消滅タイマー
        animeFrame: 0,        // 🎨 アニメーションのコマ番号
        animeTimer: 0,        // 🎨 パタパタ動くタイマー
        
        // 🔥【ゴン太専用ステータス！】
        gontaStage: 1,        // 🔄 1:チュー太色違い、2:ゴン太本体
        jumpTimer: 0,         // 🦘 ジャンプの周期を計るカウンター
        isDead: false         // ☠️ 完全に死んだかどうかのフラグ
    }
];


// アイテムの状態管理
let item = {
    x: 100, y: 15,
    isPickedUp: false
};

//爆弾の管理
let bomb = {
    x: 0, y: 0, vy: 0,
    isActive: false,
    isExploding: false,
    timer: 0,
    bombFrame: 0 // 💡 変数名のバッティングを防ぐための固有プロパティよ❤️
};

// 床の座標設定
const floors = [
    // --- 1階（地面） ---
    { x1: 15, x2: 70,  y: 169, h: 7, color: "#6e6d6c", type: "brick", ladders: [{ x: 40, top: 174}] },
    { x1: 65, x2: 815, y: 169, h:21, color: "#6e6d6c", type: "brick" },

    // --- 2階（中央階層） ---
    { x1: 55,  x2: 350, y: 113, h: 7, color: "#6e6d6c", type: "brick", ladders: [{ x: 170, top: 118} ]},
    { x1: 195, x2: 295, y: 120, h:14, color: "#6e6d6c", type: "brick" },
    { x1: 390, x2: 550, y: 113, h: 6, color: "#6e6d6c", type: "brick", ladders: [{ x: 450, top: 118} ]},
    { x1: 390, x2: 440, y: 120, h:49, color: "#6e6d6c", type: "brick" },
    { x1: 590, x2: 809, y: 113, h: 6, color: "#6e6d6c", type: "brick", ladders: [{ x: 770, top: 118} ]},
    { x1: 590, x2: 700, y: 120, h:21, color: "#6e6d6c", type: "brick" },

    // --- 3階（最上階） ---
    { x1: 55, x2: 160, y: 59, h: 6, color: "#6e6d6c" },
    { x1: 287, x2: 295, y: 59, h: 6, type: "wall" },
    { x1: 195, x2: 205, y: 59, h: 6, color: "#6e6d6c", ladders: [{ x: 202, top: 64, bottomY: 113}  ]},
    { x1: 205, x2: 295, y: 59, h: 6, color: "#6e6d6c", ladders: [{ x: 260, top: 64, bottomY: 113}  ]},
    { x1: 287, x2: 295, y: 53, h: 6, color: "#6e6d6c" },
    { x1: 287, x2: 550, y: 47, h: 6, color: "#6e6d6c" },
    { x1: 590, x2: 809, y: 59, h: 6, color: "#6e6d6c", ladders: [{ x: 680, top: 64, bottomY: 113 } ]},
   //　-----屋根-----
    { x1: 40, x2: 815, y: 0, h: 6, color: "#6e6d6c", type: "roof" },
    { x1: 40, x2: 815, y: 4, h: 6, color: "#6e6d6c", type: "roof" },
    { x1: 40, x2: 70, y: 8, h: 6, color: "#6e6d6c", type: "roof" },
    { x1: 35, x2: 65, y: 12, h: 6, color: "#6e6d6c", type: "roof" },
    { x1: 30, x2: 65, y: 16, h: 6, color: "#6e6d6c", type: "roof" },
    { x1: 25, x2: 60, y: 20, h: 6, color: "#6e6d6c", type: "roof" },
    { x1: 20, x2: 60, y: 24, h: 6, color: "#6e6d6c", type: "roof" },
    { x1: 15, x2: 55, y: 28, h: 6, color: "#6e6d6c", type: "roof" },
    { x1: 10, x2: 60, y: 32, h: 6, color: "#6e6d6c", type: "roof" },
    { x1:  5, x2: 55, y: 36, h: 6, color: "#6e6d6c", type: "roof" },
    { x1: 808, x2: 815, y: 8, h: 6, color: "#6e6d6c", type: "roof" },
    // ----両端の壁-----
    { x1: 47, x2: 54, y: 36, h: 80, type: "wall" },
    { x1: 808, x2: 814, y: 12, h: 105, type: "wall" },
    //----玄関----
    { x1: 16, x2: 48, y: 100, h: 6, color: "#6e6d6c", type: "roof" },

    // 濃い茶色のベース（長め）
    { x1: 0, x2: 10, y: 120, h: 100, color: "#efba0ccc", type: "cliff" },
    { x1: 0, x2: 20, y: 116, h: 200, color: "#CD853F", type: "cliff" },
    { x1: 0, x2: 5, y: 120, h: 200, color: "#f38a0298", type: "cliff" },
    { x1: 0, x2: 60, y: 116, h: 10, color: "#f38a0298", type: "cliff" },
    { x1: 8, x2: 15, y: 120, h: 50, color: "#f38a0298", type: "cliff" },
    { x1: 8, x2: 15, y: 120, h: 50, color: "#f38a0298", type: "cliff" },
    { x1: 8, x2: 8, y: 130, h: 50, color: "#f38a0298", type: "cliff" },
    { x1: 814, x2: 832, y: 116, h: 300, color: "#f38a0298", type: "cliff" },
    { x1: 810, x2: 832, y: 116, h: 10, color: "#efba0cc3", type: "cliff" },
    { x1: 814, x2: 832, y: 116, h: 100, color: "#CD853F", type: "cliff" },
    { x1: 822, x2: 832, y: 116, h: 200, color: "#f38a0298", type: "cliff" },
    { x1: 826, x2: 832, y: 116, h: 200, color: "#f38a0298", type: "cliff" },
    { x1: 805, x2: 812, y: 116, h: 10, color: "#efba0cc3", type: "cliff" },
    { x1: 802, x2: 808, y: 116, h: 12, color: "#CD853F", type: "cliff" },
    { x1: 806, x2: 812, y: 116, h: 20, color: "#CD853F", type: "cliff" },
    { x1: 802, x2: 832, y: 116, h: 20, color: "#CD853F", type: "cliff" },


];


//描画に関係ない昇降用のはしご座標
const CLIMB_LADDERS = [
    // ① 3階から2階へ降りるハシゴ
    { x: 205, top: 59, bottomY: 113 },
    { x: 263, top: 59, bottomY: 113 },
    { x: 683, top: 59, bottomY: 113 },
    // ② 2階から1階へ降りるハシゴ
    { x: 173, top: 113, bottomY: 168 } ,
    { x: 453, top: 113, bottomY: 168 },
    { x: 773, top: 113, bottomY: 168 },
    // ③ １階から地下へ降りるハシゴ
    { x: 42, top: 169, bottomY: 220 },
];

const pillars = [ //ブロックの柱
    { x: 225, y: 61, w: 26, h:13}, 
    { x: 480, y: 49, w: 26, h:16},
    { x: 630, y: 61, w: 26, h:13},
];

const cells = [ // ドクロの牢屋
    { x: 80,  y: 34,  w: 18, h: 25, isOpen: false, content: null, isKeyFound: false, goonieTimer: 0, goonieFrame: 0, keyTimer: 0, keyFrame: 0 }, 
    { x: 305, y: 88,  w: 18, h: 25, isOpen: false, content: null, isKeyFound: false, goonieTimer: 0, goonieFrame: 0, keyTimer: 0, keyFrame: 0 },
    { x: 485, y: 143, w: 18, h: 25, isOpen: false, content: null, isKeyFound: false, goonieTimer: 0, goonieFrame: 0, keyTimer: 0, keyFrame: 0 },
    { x: 770, y: 34,  w: 18, h: 25, isOpen: false, content: null, isKeyFound: false, goonieTimer: 0, goonieFrame: 0, keyTimer: 0, keyFrame: 0 },
];

// ゴールゲートの初期設定
let goalGate = {
    x: 90,  
    y: 148,  
    width: 16,
    isAnimating: false,
    isVisible: true, // ★最初は見えている状態
    isBreaking: false,  // 💥 破壊中フラグ
    frame: 0,
    timer: 0
};
//鍵穴
const keyHole ={x: 115, y: 130, }

// 💎 ステージ上のダイヤモンドたちの位置と初期状態
let diamonds = [
    { x: 70,  y: 62,  timer: 0, frame: 0, isHidden: true, isTaken: false },
    { x: 240, y: 8,   timer: 0, frame: 0, isHidden: true, isTaken: false },
    { x: 411, y: 62,  timer: 0, frame: 0, isHidden: true, isTaken: false },
    { x: 427, y: 62,  timer: 0, frame: 0, isHidden: true, isTaken: false },
    { x: 443, y: 62,  timer: 0, frame: 0, isHidden: true, isTaken: false },
    { x: 590, y: 62,  timer: 0, frame: 0, isHidden: true, isTaken: false },
    { x: 606, y: 62,  timer: 0, frame: 0, isHidden: true, isTaken: false },
    { x: 720, y: 62,  timer: 0, frame: 0, isHidden: true, isTaken: false },
];
player.collectedDiamonds = 0;

// 🎒 ステージ1の隠しアイテム袋の設置データ
let items = [
    { x: 110, y: 62, isHidden: true, isTaken: false, content: 'earplugs' },  
    { x: 530, y: 62, isHidden: true, isTaken: false, content: 'firecoat' }, 
];

// 🏆 ファミコン版グーニーズ完全再現・得点表オブジェクト
const SCORE_TABLE = {
    // 👾 敵撃破
    ENEMY_CHUTA: 100,
    ENEMY_GONTA: 100,
    ENEMY_GANG: 100,
    ENEMY_BAT: 200,      // キィーイ（コウモリ）
    ENEMY_SKELETON: 200, // ガラガラ（ガイコツ）
    ENEMY_FISH: 100,     // マーボウ（トビウオ）
    ENEMY_OCTOPUS: 100,  // オクトパック（タコ）
    ENEMY_ZOMBIE: 500,

    // 💎 アイテム
    ITEM_DIAMOND: 500,
    ITEM_BAG: 200,
    ITEM_HIDDEN_GET: 5000,   // 隠れキャラ時間内獲得
    ITEM_HIDDEN_MISS: 1000,  // 隠れキャラ出現のみ（時間切れ消失）

    // 🎬 イベント
    RESCUE_FRIEND: 1000,    // 仲間救出
    TIME_BONUS_MULTIPLIER: 10, // 鍵穴・クリア時の【残りタイム×10点】
    KEY_OPEN: 0, // 💡 鍵を開けた時は「残りタイム×10点」の即時計算
};

// 🌟 現在のスコアと1UP監視用の変数
let score = 0;
let next1UpScore = 50000; // 最初の1UPは5万点


// -----------------描画関数------------
function drawBackground() {
    // 1. まず全体を黒（地下・基本色）で塗る（ここはUIのマイナス空間を含めて真っ黒にするわ！）
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, -35, CONFIG.CAMERA_W, CONFIG.VIEW_H + 35);

    const skyBlue = "#4169E1"; 
    const wallBrown = "#8B4513"; 
    
    // 💡 【ここをカメラ対応に！】
    // 生のY座標から、しっかり cameraY を引いてあげるのよ！
    const drawGroundLevelY = Math.floor(116 - cameraY);   
    const drawRestaurantStartY = Math.floor(113 - cameraY); 

    const resXStart = 48;
    const resXEnd = 812;

    const drawResXStart = Math.floor(resXStart - cameraX);
    const drawResXEnd = Math.floor(resXEnd - cameraX);

    // --- A. 青空の描画（建物の外側） ---
    // 💡 高さを 0 から「カメラ引き算後の drawGroundLevelY」までに変えるわ！
    if (drawResXStart > 0) {
        ctx.fillStyle = skyBlue;
        ctx.fillRect(0, -40, drawResXStart, drawGroundLevelY + 40); // UI裏(-40)からのりしろ分を足すの⭐
    }
    if (drawResXEnd < CONFIG.CAMERA_W) {
        ctx.fillStyle = skyBlue;
        ctx.fillRect(drawResXEnd, -40, CONFIG.CAMERA_W - drawResXEnd, drawGroundLevelY + 40);
    }

    // --- B. レストランの板張り壁（建物の内側） ---
    const startX = Math.max(0, drawResXStart);
    const endX = Math.min(CONFIG.CAMERA_W, drawResXEnd);

    if (startX < endX) {
        for (let x = startX; x < endX; x++) {
            const worldX = Math.floor(x + cameraX);
            const patternX = worldX % 8;

            if (patternX < 7) {
                ctx.fillStyle = wallBrown; 
            } else {
                ctx.fillStyle = "#000000"; 
            }

            // 💡 ここも高さを「カメラ引き算後の drawRestaurantStartY」までに変更！
            ctx.fillRect(x, -40, 1, drawRestaurantStartY + 40);
        }
    }
}

function drawFloors() {


    floors.forEach(f => {
        const drawX1 = Math.floor(f.x1 - cameraX);
        const startY = Math.floor(f.y - cameraY);
        const width = Math.floor(f.x2 - f.x1);

        if (drawX1 + width > 0 && drawX1 < CONFIG.CAMERA_W) {
            const startY = Math.floor(f.y - cameraY);

            // --- 屋根 (roof) ---
            if (f.type === "roof") {
                ctx.fillStyle = "#000000";
                ctx.fillRect(drawX1, startY, width, f.h);
                ctx.fillStyle = f.color;
                ctx.fillRect(drawX1 + 2, startY + 2, width - 3, 2); 
                ctx.fillStyle = "#A0A0A0";
                ctx.fillRect(drawX1 + 1, startY + 1, width - 2, 1);
                ctx.fillRect(drawX1 + 1, startY + 1, 1, f.h - 2);

            // --- レンガ床 (brick) ---
            } else if (f.type === "brick") {
                const brickW = 16; 
                const brickH = 7;
                const rows = Math.max(1, Math.floor(f.h / brickH));
                for (let row = 0; row < rows; row++) {
                    const currentY = startY + (row * brickH);
                    const isShifted = (Math.floor(startY / brickH) + row) % 2 === 0;
                    const xOffset = isShifted ? -(brickW / 2) : 0;
                    for (let bx = xOffset; bx < width + brickW; bx += brickW) {
                        let renderX = drawX1 + bx;
                        let renderW = brickW;
                        if (renderX < drawX1) renderW -= (drawX1 - renderX), renderX = drawX1;
                        if (renderX + renderW > drawX1 + width) renderW = (drawX1 + width) - renderX;
                        if (renderW > 0) {
                            ctx.fillStyle = "#000000";
                            ctx.fillRect(renderX, currentY, renderW, brickH);
                            ctx.fillStyle = f.color;
                            ctx.fillRect(renderX, currentY, renderW - 1, brickH - 1);
                            ctx.fillStyle = "#A0A0A0";
                            ctx.fillRect(renderX, currentY, renderW - 1, 1);
                            if (renderX === drawX1 + bx) ctx.fillRect(renderX, currentY, 1, brickH - 1);
                        }
                    }
                }

            // --- ★崖・鍾乳石 (cliff) ---
            // ここでアキが作った drawJaggedCliff を呼び出すわよ！
            } else if (f.type === "cliff") {
                drawJaggedCliff(f.x1, f.y, width, f.h, f.color);

            // --- 壁 (wall) ---
            } else if (f.type === "wall") {
                drawWall(f.x1, f.y, width, f.h);

            // --- その他 (デフォルトのライン床) ---
            } else {
                const lineH = Math.max(1, Math.floor(f.h / 6)); 
                const mainH = f.h - (lineH * 2);
                ctx.fillStyle = "#A0A0A0"; 
                ctx.fillRect(drawX1, startY, width, lineH);
                ctx.fillStyle = f.color; 
                ctx.fillRect(drawX1, startY + lineH, width, mainH);
                ctx.fillStyle = "#A0A0A0"; 
                ctx.fillRect(drawX1, startY + lineH + mainH, width, lineH);
            }
        }
    });
}


function drawBrickPillar(x, y, w, h) {  //レンガの壁
    const brickW = 8;
    const brickH = 4;
    
    const drawX = Math.floor(x - cameraX);
    const startY = Math.floor(y - cameraY);

    for (let row = 0; row < h; row++) {
        let xOffset = (row % 2 === 0) ? 0 : -(brickW / 2);
        const colCount = Math.ceil(w / brickW) + 1;

        for (let col = 0; col < colCount; col++) {
            const bx = drawX + (col * brickW) + xOffset;
            const by = startY + (row * brickH);

            let renderX = bx;
            let renderW = brickW;

            if (renderX < drawX) {
                renderW -= (drawX - renderX);
                renderX = drawX;
            }
            if (renderX + renderW > drawX + w) {
                renderW = (drawX + w) - renderX;
            }

            if (renderW > 0) {
                // 1. まずレンガのメイン色（灰色）で塗りつぶす
                ctx.fillStyle = "#808080";
                ctx.fillRect(renderX, by, renderW, brickH);

                // 2. 下と右だけに「1pxの黒い線」を引く
                ctx.fillStyle = "#000000";
                
                // 下の線（底辺）
                ctx.fillRect(renderX, by + brickH - 1, renderW, 1);
                
                // 右の線（右端）
                // 柱の右端ギリギリのレンガの時は描かないようにする
                if (bx + brickW <= drawX + w) {
                    ctx.fillRect(bx + brickW - 1, by, 1, brickH);
                }

                // 3. 仕上げのハイライト（左上の1pxだけ明るく）
                // カットされていないレンガの時だけ描画
                if (renderX === bx) {
                    ctx.fillStyle = "#A0A0A0";
                    ctx.fillRect(renderX, by, 1, 1);
                }
            }
        }
    }
}

function drawWall(x, y, w, h) {  //両端の壁
    const blockSize = 8; // 8x8ブロック
    const drawX = Math.floor(x - cameraX);
    const startY = Math.floor(y - cameraY);

    // 指定された幅(w)と高さ(h)を埋めるようにループを回す
    for (let wy = 0; wy < h; wy += blockSize) {
        for (let wx = 0; wx < w; wx += blockSize) {
            
            // 8x8ブロックの中身を描画
            wallBlock.forEach((colorIdx, i) => {
                const px = i % blockSize;
                const py = Math.floor(i / blockSize);
                
                const finalX = drawX + wx + px;
                const finalY = startY + wy + py;

                // 指定された範囲(w, h)を超えないようにガード
                if (wx + px < w && wy + py < h) {
                    ctx.fillStyle = WALL_COLORS[colorIdx];
                    ctx.fillRect(finalX, finalY, 1, 1);
                }
            });
        }
    }
}

function drawCells() {  //ドクロの扉
    cells.forEach(cell => {  //扉の枠（常に描画）
        const drawX = Math.floor(cell.x - cameraX);
        const drawY = Math.floor(cell.y - cameraY);

        if (drawX + cell.w < 0 || drawX > CONFIG.CAMERA_W) return;

        const frameT = 6; 
        const lineT = 1;  
        const colorLine = "#A0A0A0"; 
        const colorMain = "#6e6d6c"; 

        // --- 1. コの字フレームの一体描画（丸み対応） ---
        
        // ① 外枠の描画
        ctx.fillStyle = colorLine;
        ctx.fillRect(drawX - frameT, drawY - frameT, cell.w + (frameT * 2), cell.h + frameT);

        // ② 中間の塗り（グレー）
        ctx.fillStyle = colorMain;
        ctx.fillRect(drawX - frameT + lineT, drawY - frameT + lineT, cell.w + (frameT * 2) - (lineT * 2), cell.h + frameT - lineT);

        // ③ 内側のライン（明銀）
        ctx.fillStyle = colorLine;
        ctx.fillRect(drawX - lineT, drawY - lineT, cell.w + (lineT * 2), cell.h + lineT);

        // --- 2. 角を削って丸みを作る ---
        ctx.fillStyle = "#000000"; // 背景色で消す

        // 外側の上の角（左右1pxずつ）
        ctx.fillRect(drawX - frameT, drawY - frameT, 1, 1);
        ctx.fillRect(drawX + cell.w + frameT - 1, drawY - frameT, 1, 1);

        // 内側の上の角（左右1pxずつ）
        // ここを削ることで、より自然なカーブに見えるわよ
        ctx.fillStyle = colorLine; 
        ctx.fillRect(drawX, drawY, 1, 1); // 内側の角を明銀で補正して馴染ませるわ❤️

        // --- 3. 最後に中を黒く塗りつぶす ---
        ctx.fillStyle = "#000000"; 
        ctx.fillRect(drawX, drawY, cell.w, cell.h + 1);

        // --- 4. 扉が閉まっている時だけドクロを描画 ---
        if (!cell.isOpen) {
            skullPrison.forEach((colorIdx, i) => {
                const px = i % 18; 
                const py = Math.floor(i / 18);
                const color = COLORS[colorIdx];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(drawX + px, drawY + py, 1, 1);
                }
            });
        }
        if (cell.isOpen) {
            if (cell.content === 'key' && !cell.isKeyFound) {
                const keyFrames = [dotKey1, dotKey2, dotKey3];
                const KEY_PALETTE = {
                    1: "#102060", 2: "#f8f8ff",
                    3: "#ffffff", 4: "#4b0082",
                    5: "#e03000", 6: "#0000f0"
                };
                // 💡 鍵専用の cell.keyFrame を使うわよ❤️
                drawCharacter(keyFrames[cell.keyFrame], cell.x, cell.y - 2, 16, KEY_PALETTE);

            } else if (cell.content === 'goonie' && !cell.isKeyFound) {
                const goonieFrames = [dotGoonie, dotGoonie1, dotGoonie2];
                
                // 💡 グーニーは元々の変数に戻すから、元のパタパタ速度に100%復旧するわ！❤️
                drawCharacter(goonieFrames[cell.goonieFrame], cell.x, cell.y + 4, 16);
            }
        }
    });
}

// 🌟 文字だけを一番手前に描くための専用関数よ！
function drawGoonieText() {
    if (goonieText.isVisible) {
        ctx.save();
        
        ctx.globalAlpha = goonieText.alpha;
        ctx.fillStyle = "white";
        ctx.font = "bold 9px 'Courier New'";
        ctx.textAlign = "center";
        
        // 元の計算のままでバッチリよ⭐
        ctx.fillText("THANK YOU!!", goonieText.x - cameraX, goonieText.y - cameraY);
        
        ctx.restore();
    }
}

function drawJaggedCliff(x, y, w, h, color) {
    const drawX = Math.floor(x - cameraX);
    const startY = Math.floor(y - cameraY);

    // 砂っぽさを出すための3色のバリエーションを作るわ
    // メインの色（color）に近い色を自動で計算するのは難しいから、
    // ここではシンプルに「不透明度」を変えることで砂の粒を表現するわね❤️
    const grains = [
        color,               // 1. メインの色
        "rgba(255,255,255,0.15)", // 2. 少し明るい粒（ハイライト）
        "rgba(0,0,0,0.2)"    // 3. 少し暗い粒（影）
    ];

    for (let dy = 0; dy < h; dy++) {
        const narrowing = (dy / h) * (w / 2);
        
        // ボコボコ計算（ここは前と同じよ）
        const wobbleLeft = Math.sin(dy * 0.8 + x) * 1.5;
        const wobbleRight = Math.cos(dy * 0.7 + x) * 1.5;

        let leftEdge = Math.floor(narrowing + wobbleLeft);
        let rightEdge = Math.floor(w - narrowing + wobbleRight);

        for (let dx = leftEdge; dx < rightEdge; dx++) {
            // --- ここで砂っぽさを出すわよ！ ---
            // 座標 (x+dx, y+dy) に基づいて、3色からランダムに選ぶ
            // Math.random() だとチラつくから、座標を使った計算にするわね
            const noiseIdx = Math.abs(Math.floor(Math.sin((drawX + dx) * (startY + dy)) * 10)) % 10;
            
            if (noiseIdx < 7) {
                ctx.fillStyle = grains[0]; // 70% はメインの色
            } else if (noiseIdx < 9) {
                ctx.fillStyle = grains[2]; // 20% は暗い粒
            } else {
                ctx.fillStyle = grains[1]; // 10% は明るい粒
            }

            ctx.fillRect(drawX + dx, startY + dy, 1, 1);
        }
    }
}

function drawMikey(data, x, y, forcedWidth) {
    const width = forcedWidth || CONFIG.BASE_WIDTH;
    const height = Math.floor(data.length / width);
    const offset = CONFIG.BASE_HEIGHT - height; 

    const startX = Math.floor(x);
    const startY = Math.floor(y);

    // 💖 マイキー専用だから、最初から堂々とパレットハックを仕込めるわ！
    let currentPalette = COLORS;

    // 無敵時間中かつ、点滅のタイミングなら黄色パレットにする
    if (player.damageTimer > 0 && Math.floor(player.damageTimer / 3) % 2 === 0) {
        currentPalette = FLASH_COLORS; 
    }

    data.forEach((colorIndex, i) => {
        const color = currentPalette[colorIndex];
        if (color) {
            const px = (startX - cameraX + (i % width)) * CONFIG.SCALE;
            const py = (startY  - cameraY + offset + Math.floor(i / width)) * CONFIG.SCALE;
            ctx.fillStyle = color;
            ctx.fillRect(px, py, CONFIG.SCALE, CONFIG.SCALE); 
        }
    });
}

function drawCharacter(data, x, y, forcedWidth) {
    const width = forcedWidth || CONFIG.BASE_WIDTH;
    const height = Math.floor(data.length / width);
    const offset = CONFIG.BASE_HEIGHT - height; 

    const startX = Math.floor(x);
    const startY = Math.floor(y);

    data.forEach((colorIndex, i) => {
        const color = COLORS[colorIndex];
        if (color) {
            // カメラ設定込みの座標計算
            const px = (startX - cameraX + (i % width)) * CONFIG.SCALE;
            const py = (startY - cameraY + offset + Math.floor(i / width)) * CONFIG.SCALE;
            ctx.fillStyle = color;
            // ここ！1px固定じゃなくて、SCALE分だけ広げてあげるわ❤️
            ctx.fillRect(px, py, CONFIG.SCALE, CONFIG.SCALE); 
        }
    });
}

// ドット絵を「半分サイズ」で描く専用
function drawSmallCharacter(data, x, y, forcedWidth) {
    const width = forcedWidth || CONFIG.BASE_WIDTH;
    const height = Math.floor(data.length / width);
    const offset = CONFIG.BASE_HEIGHT - height; 

    const startX = Math.floor(x);
    const startY = Math.floor(y);

    data.forEach((colorIndex, i) => {
        const color = COLORS[colorIndex]; 
        if (color) {
            // ここが魔法の計算！
            // (i % width) に 0.5 をかけることで、横の並びを半分に凝縮
            // Math.floor(i / width) に 0.5 をかけることで、縦の並びを半分に凝縮
            const px = (startX - cameraX + (i % width) * 0.7) * CONFIG.SCALE;
            const py = (startY - cameraY + offset + Math.floor(i / width) * 0.7) * CONFIG.SCALE;
            
            ctx.fillStyle = color;
            
            // 塗るサイズも CONFIG.SCALE の半分に
            const smallPixel = CONFIG.SCALE / 0.9;
            ctx.fillRect(px, py, smallPixel, smallPixel); 
        }
    });
}

function drawChutas() {  //チュー太
    chutas.forEach(chuta => {
        if (chuta.isDead) return; // 死んでたら描画もしないわ

        if (chuta.state === 'none') return;

        // 1️⃣ 向きによってドットデータを切り替えるの
        let chutaData;
        if (chuta.dir === 'left') {
            chutaData = (chuta.animeFrame === 0) ? dotChutaLeft : dotChutaLeft2;
        } else {
            chutaData = (chuta.animeFrame === 0) ? dotChutaRight : dotChutaRight2;
        }
        

        // 2️⃣ パレットを一時的に退避（バックアップ）
        const originalColor1 = COLORS[1];
        const originalColor2 = COLORS[2];
        const originalColor3 = COLORS[3];
        const originalColor4 = COLORS[4];
        const originalColor7 = COLORS[7];
        const originalColor9 = COLORS[9];

        if (chuta.state === 'die') {
            COLORS[4] = SMOKE_COLORS[4] || "#000000";
            COLORS[7] = SMOKE_COLORS[7] || "#A0A0A0";
            COLORS[9] = SMOKE_COLORS[9] || "#FFFFFF";
            
            // animeFrame=2 のときは smoke2（大きい煙）を描画
            if (smoke2) {
                drawCharacter(smoke2, chuta.x, chuta.y, 16);
            }

        // 爆弾アイテム状態の描画
        } else if (chuta.state === 'item') {
            // あきくんのUI用パレット（スイカ赤など）をセット
            COLORS[4] = "#FFFFFF"; 
            COLORS[7] = "#f8f8ffde"; 
            COLORS[8] = "#00FFFF"; 

            // あきくんのファイルにある爆弾アイテムのドット絵（おそらく bombItem や dotBomb ）を指定してね❤️
            // もし別の名前なら、下の「bombItem」をその名前に書き換えてちょうだい！
            if (typeof bombItem !== 'undefined') {
                drawCharacter(bombItem, chuta.x, chuta.y, 16);
            } else if (typeof dotBomb !== 'undefined') {
                drawCharacter(dotBomb, chuta.x, chuta.y, 16);
            } else {
                // 万が一ドット絵が見つからなかった時のために、仮で四角形を出しておくわ❤️
                ctx.fillStyle = "#de3831";
                ctx.fillRect(chuta.x - cameraX + 4, chuta.y + 4, 8, 8);
            }



        // 3️⃣ パレットを専用に一時的にハック（上書き）
        } else if (chuta.state === 'spawn') {
            // 🌟 煙専用のカラーパレットを注入してあげるの…んっ❤️
            COLORS[4] = SMOKE_COLORS[4] || "#000000";
            COLORS[7] = SMOKE_COLORS[7] || "#A0A0A0";
            COLORS[9] = SMOKE_COLORS[9] || "#FFFFFF";

            let smokeData = null;
            if (chuta.animeFrame === 1) smokeData = smoke1; // 小さい煙
            if (chuta.animeFrame === 2) smokeData = smoke2; // 大きい煙

        // 4️⃣ 描画実行！
            // 煙のデータがある時だけ描画（消えるステップの時は何も描画しない）
            if (smokeData) {
                drawCharacter(smokeData, chuta.x, chuta.y, 16);
            }

        } else {
            // 🌟 いつものトコトコチュー太ちゃんの描画❤️
            let chutaData = (chuta.dir === 'left') 
                ? ((chuta.animeFrame === 0) ? dotChutaLeft : dotChutaLeft2)
                : ((chuta.animeFrame === 0) ? dotChutaRight : dotChutaRight2);

            COLORS[1] = MOUSE_COLORS[1];
            COLORS[2] = MOUSE_COLORS[2];
            COLORS[3] = MOUSE_COLORS[3];
            COLORS[4] = MOUSE_COLORS[4];

        // 4️⃣ 描画実行！
            if (chutaData) {
                drawCharacter(chutaData, chuta.x, chuta.y, 16);
            }
        }


        //5️⃣ 【最重要】パレットを元に戻す
        COLORS[1] = originalColor1;
        COLORS[2] = originalColor2;
        COLORS[3] = originalColor3;
        COLORS[4] = originalColor4;
        COLORS[7] = originalColor7;
        COLORS[9] = originalColor9;
    });
}


function drawGontas() {  // ゴン太の描画魔法よ❤️
    gontas.forEach(gonta => {
        if (gonta.isDead) return; // 死んでたら描画もしないわ
        if (gonta.state === 'none') return;

        // 1️⃣ パレットを一時的に退避（バックアップ：あきくんのシステムを完全リスペクト！❤️）
        const originalColor1 = COLORS[1];
        const originalColor2 = COLORS[2];
        const originalColor3 = COLORS[3];
        const originalColor4 = COLORS[4];
        const originalColor7 = COLORS[7];
        const originalColor9 = COLORS[9];

        // 2️⃣ 【死亡演出中（state: 'die'）の描画】
        if (gonta.state === 'die') {
            COLORS[4] = SMOKE_COLORS[4] || "#000000";
            COLORS[7] = SMOKE_COLORS[7] || "#A0A0A0";
            COLORS[9] = SMOKE_COLORS[9] || "#FFFFFF";
            
            // アニメーションフレームによって煙の大・小を切り替えるわ！
            let smokeData = (gonta.animeFrame === 2) ? smoke2 : smoke1;
            if (smokeData) {
                drawCharacter(smokeData, gonta.x, gonta.y, 16);
            }

        // 3️⃣ 【爆弾アイテム状態（state: 'item'）の描画】
        } else if (gonta.state === 'item') {
            COLORS[4] = "#FFFFFF"; 
            COLORS[7] = "#f8f8ffde"; 
            COLORS[8] = "#00FFFF"; 

            if (typeof bombItem !== 'undefined') {
                drawCharacter(bombItem, gonta.x, gonta.y, 16);
            } else if (typeof dotBomb !== 'undefined') {
                drawCharacter(dotBomb, gonta.x, gonta.y, 16);
            } else {
                ctx.fillStyle = "#de3831";
                ctx.fillRect(gonta.x - cameraX + 4, gonta.y + 4, 8, 8);
            }

        // 4️⃣ 【出現中（state: 'spawn'）の描画】
        } else if (gonta.state === 'spawn') {
            COLORS[4] = SMOKE_COLORS[4] || "#000000";
            COLORS[7] = SMOKE_COLORS[7] || "#A0A0A0";
            COLORS[9] = SMOKE_COLORS[9] || "#FFFFFF";

            let smokeData = null;
            if (gonta.animeFrame === 1) smokeData = smoke1; 
            if (gonta.animeFrame === 2) smokeData = smoke2; 

            if (smokeData) {
                drawCharacter(smokeData, gonta.x, gonta.y, 16);
            }

        // 5️⃣ 【通常トコトコ状態（state: 'walk'）の描画】
        } else {
            if (gonta.gontaStage === 1) {
                // 🐭 【第1形態：チュー太変装モード】
                // グラフィックは普通の「チュー太」のデータを借りるわ！
                let chutaData = (gonta.dir === 'left') 
                    ? ((gonta.animeFrame === 0) ? dotChutaLeft : dotChutaLeft2)
                    : ((gonta.animeFrame === 0) ? dotChutaRight : dotChutaRight2);

                // パレットをゴン太の第1形態専用（オレンジ＆ゴーストホワイト）にハック！
                COLORS[1] = GONTA_COLORS_STAGE1[1];
                COLORS[2] = GONTA_COLORS_STAGE1[2];
                COLORS[3] = GONTA_COLORS_STAGE1[3];
                COLORS[4] = GONTA_COLORS_STAGE1[4];

                if (chutaData) {
                    drawCharacter(chutaData, gonta.x, gonta.y, 16);
                }
            } else {
                // 🦍 【第2形態：ゴン太本体モード！！】
                // グラフィックは、あきくん直伝の「gontaRight2」などの最新データよ！
                // アニメーションフレーム（0か1）のパタパタをここで判定するわね❤️
                let gontaData;
                if (gonta.dir === 'left') {
                    // ※もし左向きのパタパタ用データ（gontaLeft3など）を作ったらここに割り振ってね。
                    // 現時点では反転してくれた1ポーズ目を美しく表示させるわ！❤️
                    gontaData = gontaLeft2; 
                } else {
                    gontaData = gontaRight2;
                }

                // パレットをゴン太本体専用（オレンジ＆キャラメルブラウン）にするわ！
                COLORS[1] = GONTA_COLORS_STAGE2[1];
                COLORS[2] = GONTA_COLORS_STAGE2[2];

                if (gontaData) {
                    drawCharacter(gontaData, gonta.x, gonta.y, 16);
                }
            }
        }

        // 6️⃣ 【最重要】パレットを元に戻す（あきくんの安全対策を完全引き継ぎ❤️）
// 6️⃣ 【最重要】パレットを元に戻す（あきくんの安全な形に完全修正よ！❤️）
        COLORS[1] = originalColor1;
        COLORS[2] = originalColor2;
        COLORS[3] = originalColor3;
        COLORS[4] = originalColor4;
        COLORS[7] = originalColor7;
        COLORS[9] = originalColor9;
    });
}


// キーの状態を記憶する
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true); // Fキー用
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
//パチンコ用のkeydown
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'f') {
        // すでに攻撃中(isAttacking)なら、何もさせない
        if (player.isAttacking) return;

        // 弾が飛んでいる間は何もさせない
        const isBulletFlying = bullets.some(b => b.active);
        if (isBulletFlying) return;

        
        player.isAttacking = true;
        player.attackTimer = 15; // 構える時間の間隔

        if (player.hasPachinko) {
            fireBullet();
        }
    }
});

// 📱 スマホのタッチ入力を記録する秘密の引き出しよ❤️
const touchKeys = {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,  // 🅰️ Aボタン用（ジャンプ）
    action: false // 🅱️ Bボタン用（キック）
};


// 爆弾を設置する動作
// 🔎 修正場所：main.js の 460行目付近「spawnBomb()」関数を丸ごと差し替え
function spawnBomb() {
    // ❤️ 「爆弾を1個持っている」かつ「すでに画面に爆弾が出ていない」ときだけ実行！
    if (inventory.bomb === 1 && !bomb.isActive && !bomb.isExploding) {
        bomb.isActive = true; 
        
        // マイキーの少し前方に設置する計算
        bomb.x = (player.direction === 'right') ? player.x + 10 : player.x - 10;
        bomb.y = player.y;
        bomb.vy = 0; // 重力計算のための初期化
        bomb.timer = 0;

        // 消費したらなくなる。
        inventory.bomb = 0;
    }
}

// キック（またはパチンコ）を繰り出す動作
function performKick() {
    if (!player.isAttacking && (player.pachinkoCooldown || 0) <= 0) {
        player.isAttacking = true;
        player.attackTimer = 15;
        if (player.hasPachinko) fireBullet();
    }
}


// =========================================================================
// ⏱️ 60FPS固定リミッター用の秘密の変数たち（updateのすぐ上に置いてね❤️）
// =========================================================================
let lastTime = 0;              // 💡 最後にゲームを動かした時間を記録するわ
const fpsInterval = 1000 / 60; // 💡 60FPSの1フレームの長さ（約16.67ms）よ！

//------メインループ------
function update(currentTime) {

    // 1️⃣ 最初の1回目の時間を記録するわ
    if (!lastTime) {
        lastTime = currentTime;
    }

    // ⏱️ 前回の描画からどれくらい時間が経ったか計算するの
    const elapsed = currentTime - lastTime;

    // 🛑 もし1秒間に60回のペース（約16.67ms）に達していなければ、
    // ゲームの処理を進めずにここでストップ（スルー）させて門前払いよッ！
    if (elapsed < fpsInterval) {
        // 次のチャンスを待つために、ここですぐに requestAnimationFrame を呼んでループを回すわ！
        requestAnimationFrame(update);
        return; 
    }

    // 🎯 16.67msが経過した（＝60FPSのタイミングになった）ので、
    // 次のブレーキのために、余った時間を微調整しながら lastTime を更新するわ！
    lastTime = currentTime - (elapsed % fpsInterval);

    // =========================================================================
    // 🚀【ここから下は、ブレーキをすり抜けた選ばれし60FPSの世界よ❤️】
    // =========================================================================

    if (isTitleScreen) {
        handleTitleInput(); 
        requestAnimationFrame(update);
        return; 
    }

    // 🎮 ゲーム本編の描画処理の最初、またはリサイズ処理の最後に入れるわよ❤️
    if (!isTitleScreen) {
        // 🎨 キャンバスの基準位置をリセットしてから、Y軸を+35ズラすシンプルなファミコン力よ！
        ctx.setTransform(1, 0, 0, 1, 0, 0); // 基準を完全にリセット⭐
        ctx.translate(0, 35);               // UIエリア（35px分）を下へズラすッ❤️
    }

    // ------------------------------------------------------------------
    // 🎨 【常時描画】画面をフリーズさせないための絶対防衛線
    // ------------------------------------------------------------------
    drawBackground();
    pillars.forEach(p => drawBrickPillar(p.x, p.y, p.w, p.h));
    drawCells();      
    drawFloors();
    drawGoonieText(); 
    
    // 💡 ギャングが動く前の「今の座標」をガッチリ記憶して監禁するわよ❤️
    let savedGangX = (typeof enemy !== 'undefined' && enemy) ? enemy.x : null;
    let savedGangY = (typeof enemy !== 'undefined' && enemy) ? enemy.y : null;

    updatePlayerStatus();
    
    if (typeof keys === 'undefined') { var keys = {}; }

    // ------------------------------------------------------------------
    // 🎮 ⏰ 【あきくん世界静止マジック発動ゾーン！】
    // ------------------------------------------------------------------
    if (!player.isStunned && !player.isDead) {
        
        handleInput();            
        applyPhysicsToObj(player);

        updateEnemyBullets();     // ギャングの弾
        updateBombIndependent();  // 爆弾
        checkCollision();         // あたり判定(ギャング側)
        checkExplosion();         // あたり判定(爆弾による)
        checkGateWall();          
        checkEnemyBulletCollision(); 
        checkChutaCollisions();
        checkGontaCollisions();
        checkDiamondCollision();  
        checkItemBagCollision();  
        checkHiddenItems();       

        updateDiamondsIndependent();
        checkItemCollision();     
        
        updateChutas();           // 🐭 チュー太フリーズ
        updateGontas();           // 🪨 ゴン太フリーズ
        updateBullets();
        setupTouchControls();
        
    }

    // ------------------------------------------------------------------
    // 🎬 【アニメーション＆最終描画】
    // ------------------------------------------------------------------
    updateAnimation();  // ⚠️ もしこの中でギャングが勝手に歩いていても……
    
    // 💡【あきくん監修：ギャング絶対拘束システム】
    // マイキーがやられている間は、ギャングの座標をさっき保存した位置に強制逆戻り！1ミリも動かさない
    if ((player.isStunned || player.isDead) && typeof enemy !== 'undefined' && enemy) {
        if (savedGangX !== null) enemy.x = savedGangX;
        if (savedGangY !== null) enemy.y = savedGangY;
    }

    render();           
    drawUI(); 

    drawItemsIndependent();   
    drawDiamondsIndependent();
    updateCellItemsIndependent(); 
    
    drawChutas();       
    drawGontas();       
    
    updateCamera();

          
    // 💡 BGMのイントロ付きループ処理（update() の中に追加してね⭐）
    if (bgm && !bgm.paused) {
        // ⏰ もし曲の終わり（例：3分00秒＝180秒）に到達したら...
        if (bgm.currentTime >= 137.5) { 
            
            // 🔄 ループの開始地点（例：20秒）まで時間を巻き戻す！
            bgm.currentTime = 13; 
            
            // 💡 巻き戻した位置から、そのまま途切れず再生を続けさせるわよ❤️
            bgm.play().catch(() => {}); 
            
            console.log("🎵 BGMがループポイント（20秒）に戻ったわよ！");
        }
    }
    requestAnimationFrame(update);
}




// --- 以下、機能別の分室 ---

function handleInput() {
    if (isTitleScreen) {
        const gp = navigator.getGamepads()[0];
        
        // 🔑 キーボードのスペースキー、またはコントローラーのボタン[2]（ジャンプボタンなど）が押されたらスタート！
        let isStartButtonPressed = keys['Space'] || (gp && gp.buttons[2]?.pressed);

        if (isStartButtonPressed) {
            isTitleScreen = false; // タイトル画面を終了してゲーム本編へ！

            // 🌟ここでキャンバスサイズをゲーム本編用の140px（スクロール用余白あり）に可変させるの…んっ❤️
            adjustCanvasSize();

            // 🎵 【ここでBGMを始動！】ブラウザの音ロックが完璧に解除されて鳴り響くわよ！
            bgm.loop = true;
            bgm.play().catch(error => console.log("BGM始動エラー回避:", error));
            
            console.log("【あきくん設計】PUSH START！ゲーム本編を開始しました⭐");
        }
        
        return; // ⚠️ タイトル画面中は、この下のマイキーの移動などの処理は実行させずにここでストップする
    }

    const gp = navigator.getGamepads()[0];

    if (player.isLocked) {
        player.vx = 0;
        player.vy = 0;
        return; 
    }

    //クリア時の自動操作
    if (player.isAutoMoving) {
        player.isMoving = true; // アニメーションのために常に移動中にする

        // ------------------------------------------------------------------
        // ⏱️ 🎯【高速タイム清算処理！】
        // ------------------------------------------------------------------
        // 💡 立ち止まりタイマー（clearWaitTimer）の代わりに、「タイム清算フラグ」で管理
        if (player.isTimeCountingDown) {
            player.isMoving = false;  // 立ち止まり中なので足踏みアニメを止める

            // 💡【あきくんの設定❤️】3倍速にするために1回あたり3秒ずつ大清算するわよ！
            const decrementAmount = 3; 

            // 🎵 最初の1回目だけ、今のgameTimerの値を音の基準点として記憶させるわ⭐
            if (typeof player.lastSoundTimer === 'undefined') {
                player.lastSoundTimer = gameTimer;
                
                // 🚪 到着した瞬間の最初の1回も、小気味よく音を鳴らしておくわね❤️
                if (typeof keySE !== 'undefined') {
                    keySE.currentTime = 0;
                    keySE.play().catch(() => {});
                }
            }

            if (gameTimer > 0) {
                // 残り時間が3秒以上あるなら3秒減らす、足りないなら残りを全部引く処理よ！
                let currentTickReduce = Math.min(gameTimer, decrementAmount);
                
                gameTimer -= currentTickReduce;          // ⏳ 3倍速でgameTimerをドバッと減らす！
                score += currentTickReduce * 10; // 🏆 減った分だけスコアに一気に加算（1秒あたり10点）！
                
                // ----------------------------------------------------------
                // 🔊 【あきくんのこだわりロジック】音の間引きシステム発動！
                // ----------------------------------------------------------
                // 💡 最後に音を鳴らした基準点（lastSoundTimer）から、10秒以上タイムが減少したかチェック！
                if (player.lastSoundTimer - gameTimer >= 10) {
                    if (typeof keySE !== 'undefined') {
                        keySE.currentTime = 0;
                        keySE.play().catch(() => {});
                    }
                    // 🎯 音を鳴らしたから、今のgameTimerを次の「10秒チェック用」の新しい基準点にするわよ❤️
                    player.lastSoundTimer = gameTimer;
                }

            } else {
                // 🏁 タイムが完全に0になった瞬間の処理よ！
                player.isTimeCountingDown = false; // 清算フラグをOFF！
                delete player.lastSoundTimer;      // 次のクリアのために音用変数をキレイに消去⭐
                
                // 🚀 はしご（43）へ向けて再出発よあきくんッ！
                player.autoTargetX = 43; 
                console.log("【あきくん設計】音すっきりタイム清算完了！はしごへ向かいます🏃");
            }
            return; // タイム清算中は下の歩行移動をスキップ
        }

        // ------------------------------------------------------------------
        // 🚶‍♂️ 1️⃣ はしご（または中継点）のX座標に向かって歩く処理
        // ------------------------------------------------------------------
        if (player.x !== player.autoTargetX) {
            if (player.x > player.autoTargetX) {
                player.x -= 1; // 🚶‍♂️ 左へ
                if (player.x < player.autoTargetX) player.x = player.autoTargetX;
            } else if (player.x < player.autoTargetX) {
                player.x += 1; // 🚶‍♂️ 右へ（クリア直後に50や60へ向かう時用⭐）
                if (player.x > player.autoTargetX) player.x = player.autoTargetX;
            }

            // 💡 【超重要】もし今右へ歩いていて、最初の目的地「60」にぴったり重なった瞬間！
            if (player.x === 60 && player.autoTargetX === 60) {
                // ⏳ ここで固定タイマーの代わりに、高速カウントダウンフラグをONにするわよ❤️
                player.isTimeCountingDown = true; 
                console.log("【あきくん設計】中継点（60）に到着！これより残りタイムの高速清算を開始しますッ✨");
            }
        } 
        // ------------------------------------------------------------------
        // 🪜 2️⃣ はしごのX座標（43）にぴったり重なった場合：下へ降りる
        // ------------------------------------------------------------------
        else {
            player.x = player.autoTargetX; // X座標をロック
            player.isOnLadder = true;      // 強制的にはしご登り（降り）状態へ
            player.y += 1;                 // 1ピクセルずつ下へ降りていく

            // 3️⃣ 画面の下（または見えなくなる有効範囲）に消えたら演出終了！
            if (player.y > 200) { 
                player.isAutoMoving = false;
                player.isMoving = false;
                player.autoTargetX = 50; 
            }
        }
        return; 
    }



    // 1. 行動不能な状態の時は、入力を受け付けない
    if (player.isAttacking || player.isStunned || player.isDead) return;

    
    // 🕹️ 2. 入力状態の定義（キーボード、パッド、そしてスマホタッチを全部合体よあきくん❤️）
    let isUpPressed = keys['ArrowUp'] || (gp && (gp.buttons[12]?.pressed || gp.axes[1] < -0.3)) || touchKeys.up;
    let isDownPressed = keys['ArrowDown'] || (gp && (gp.buttons[13]?.pressed || gp.axes[1] > 0.3)) || touchKeys.down;
    let isLeftPressed = keys['ArrowLeft'] || (gp && (gp.buttons[14]?.pressed || gp.axes[0] < -0.3)) || touchKeys.left;
    let isRightPressed = keys['ArrowRight'] || (gp && (gp.buttons[15]?.pressed || gp.axes[0] > 0.3)) || touchKeys.right;
    
    // 🅰️ ジャンプ：Spaceキー、パッド[2]、またはスマホのAボタン（上は絶対に混ぜないわッ❤️）
    let isJumpButtonPressed = keys['Space'] || (gp && gp.buttons[2]?.pressed) || touchKeys.jump;
    
    // 🅱️ キック：Fキー、パッド[0]、またはスマホのBボタン
    let isActionPressed = keys['KeyF'] || keys['f'] || (gp && gp.buttons[0]?.pressed) || touchKeys.action;
    
    // 3. 画面端の制限
    if (player.x < 0) player.x = 0;
    if (player.x > CONFIG.WORLD_W - 16) player.x = CONFIG.WORLD_W - 16;


    // 💡「まだBGMが再生されていなくて（paused）」かつ「どれかのボタンやキーが押された」瞬間！
    if (bgm.paused && !isGameCleared && !player.isStunned && !player.isDead) {
        if (isUpPressed || isDownPressed || isLeftPressed || isRightPressed || isJumpButtonPressed || isActionPressed) {
            
            bgm.loop = true;
            bgm.play().then(() => {
                console.log("【あきくん設計】コントローラー（またはキー）の入力を検知！BGM始動❤️");
            }).catch(error => {
                console.log("ブラウザブロック対策: ", error);
            });

        }
    }

    //---------🪜はしごに関連するコード--------

    const footY = player.y + 21; // マイキーの正確な足元
    let currentLadder = null;

    // ① 専用のデータ配列（CLIMB_LADDERS）から、今いるハシゴを1発で探すわよ！❤️
    for (let lad of CLIMB_LADDERS) {
        // 左右の判定：マイキーの中心（x+8）が、ハシゴの幅（lad.x から lad.x + 16）の中にいるか？
        // 遊び（のりしろ）を左右5px作ってあるから、多少ずれて歩いてきても検知するわ❤️
        const isInsideX = (player.x + 8 >= lad.x - 5 && player.x + 8 <= lad.x + 21); 
        
        // 上下の判定：足元が、ハシゴの上の床（top）から下の床（bottomY）の間にいるか？
        const isInsideY = (footY >= lad.top - 2 && footY <= lad.bottomY + 2);

        if (isInsideX && isInsideY) {
            currentLadder = lad;
            break;
        }
    }

    // ② ハシゴを「掴む」判定（純粋な床の高さとピッタリ一致でガシッとハメ込む❤️）
    if (currentLadder) {
        if (!player.isOnLadder) {
            // 【下り】：上の床（top）にピッタリ立って、下を押した瞬間！
            if (isDownPressed && Math.abs(footY - currentLadder.top) <= 5) {
                player.isOnLadder = true;
                player.x = currentLadder.x; // 横幅をハシゴの左端にピッタリロック！
            }
            // 【登り】：下の床（bottomY）にピッタリ立って、上を押した瞬間！
            else if (isUpPressed && Math.abs(footY - currentLadder.bottomY) <= 5) {
                player.isOnLadder = true;
                player.x = currentLadder.x; // 横幅をハシゴの左端にピッタリロック！
            }
        }
    } else {
        player.isOnLadder = false;
    }

    // ③ ハシゴの「昇り降り」移動処理（純粋な座標移動よ！）
    if (player.isOnLadder && currentLadder) {
        player.isClimbing = false;

        if (isUpPressed) {
            player.y -= 1.0; // スイスイ上に登る
            player.isClimbing = true; 

            // 【脱出：上】上の床（top）まで登りきったらハシゴ解除して着地！
            if (player.y + 21 <= currentLadder.top) {
                player.isOnLadder = false;
                player.isClimbing = false;
                player.y = currentLadder.top - 21; // 床の上に綺麗に直立❤️
            }
        } 
        else if (isDownPressed) {
            player.y += 1.0; // スイスイ下に降りる
            player.isClimbing = true; 

            // 【脱出：下】下の床（bottomY）まで降りきったらハシゴ解除して着地！
            if (player.y + 21 >= currentLadder.bottomY) {
                player.isOnLadder = false;
                player.isClimbing = false;
                player.y = currentLadder.bottomY - 21; // 地面に綺麗に直立❤️
            }
        }
        return; // 通常移動（左右の歩行計算）を遮断するシャッター❤️
    }
    // --------- 🪜 ハシゴシステム ここまで 🪜 ---------

    // 6. 攻撃（キック・爆弾）
    if (!player.isOnLadder && isActionPressed && !player.isAttacking) {
        if (isDownPressed) {
            spawnBomb();
        } else if (!player.isJumping && !player.isSquatting) {
            performKick();
        }
    }

    // 7. 移動とジャンプの最終処理 
    if (!player.isOnLadder) {
        player.isSquatting = isDownPressed;
        player.isMoving = false;

        if (!player.isSquatting) {
            if (isRightPressed) {
                player.x += SPEED; player.direction = 'right'; player.isMoving = true;
            } else if (isLeftPressed) {
                player.x -= SPEED; player.direction = 'left'; player.isMoving = true;
            }
        }


        // 「もし今、はしごを掴んでいない」かつ
        // 「(スペース/ボタンが押された) または (はしごがない場所で上が押された)」時だけジャンプさせるわ！
      const isWantsToJump = isJumpButtonPressed || (keys['ArrowUp'] && !player.isOnLadder);

        if (isWantsToJump && !player.isJumping) {
            player.vy = JUMP_POWER;
            player.isJumping = true;
            jumpSE.currentTime = 0;    
            jumpSE.play();
        }
    }

    // --- 🌟 マイキーの無敵タイマーのカウントダウンを追加 🌟 ---
    if (player.damageTimer > 0) {
        player.damageTimer--;
    }


    //　-------　鍵の取得コード　-------
    cells.forEach((cell) => {
        // 1. 扉が開いていて、まだ中身（鍵など）を拾っていないかチェック
        // hasKey の代わりに content を、isKeyFound で拾ったかを判定する
        if (cell.isOpen && !cell.isKeyFound) {
            
            // マイキーの当たり判定
            const dx = (player.x + 8) - (cell.x + 8);
            const dy = (player.y + 10) - (cell.y + 10);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 15) {
                cell.isKeyFound = true;
                // 中身が「鍵」だった場合
                if (cell.content === 'key') {

                    // 左から順に空いている枠へ鍵を入れていくわよ❤️
                    if (!inventory.key1) {
                        inventory.key1 = true;
                        keySE.play();
                    } else if (!inventory.key2) {
                        inventory.key2 = true;
                        keySE.play();
                    } else if (!inventory.key3) {
                        inventory.key3 = true;
                    }
                    console.log("鍵を手に入れたわ！あきくん、ナイス❤️");
                } 
                    if (inventory.key1 && inventory.key2 && inventory.key3) {
                        threeKeysSE.currentTime = 0; // 巻き戻して……
                        threeKeysSE.play();          // 🎺 3本揃った歓喜のファンファーレを鳴らす！❤️
                        console.log("【あきくん設計】3本の鍵がすべて揃いました！ファンファーレ再生⭐");
                    }
                // 3. 中身が「グーニー」だった場合
                else if (cell.content === 'goonie') {
                    score += SCORE_TABLE.RESCUE_FRIEND;
                    cell.isKeyFound = true; // グーニーが画面から消える

                    // 🌟 救出した瞬間に、その場所からメッセージを出現させるわよ！
                    goonieText.x = cell.x + 8; // 牢屋の真ん中あたり
                    goonieText.y = cell.y;     // 牢屋の高さ
                    goonieText.alpha = 1.0;    // クッキリ表示
                    goonieText.isVisible = true;

                    goonieSE.currentTime = 0;
                    goonieSE.play();
                    console.log("グーニーを救出したわ❤️");
                }
            }
        }
    });



/*if (keys['Space']) {　　//開発用、スペースで、ダウンする
    if (!player.isStunned && !player.isDead) {
        player.isStunned = true;
        player.respawnTimer = 0;
        player.vy = JUMP_POWER; // 悶絶して飛び上がる
    }
}*/
if (keys[' ']) {    //開発用、スペースで扉が崩壊
        if (!goalGate.isAnimating && goalGate.frame === 0) {
            goalGate.isAnimating = true;
            goalGate.timer = 0;
        }
}


    //-----------床の計算-----------
    let onGround = false;

    for (let f of floors) {
        // 🌟 壁や崖、屋根は足場（床）の判定から除外
        if (f.type === "wall" || f.type === "cliff" || f.type === "roof") {
            continue;
        }
        // マイキーの足元（x座標）が床の範囲内かチェック
        if (player.x + 4 < f.x2 && player.x + 12 > f.x1) {
            // 落下中で、かつ足元が床の表面を通過しようとしたら着地！
            if (player.dy >= 0 && 
                player.y + 16 <= f.y && 
                player.y + 16 + player.dy >= f.y) {
                
                player.y = f.y - 16;
                player.dy = 0;
                player.isJumping = false;
                onGround = true;
                break; 
            }
        }
    }

    // どの床にも乗っていなければ「ジャンプ中（落下中）」扱いにする
    if (!onGround && !player.isJumping) {
        player.isJumping = true;
    }
    

    //ゴールの扉の崩壊
    if (inventory.key1 && inventory.key2 && inventory.key3 && !isGameCleared) {
        const isAtGoalHeight = Math.abs(player.y - 130) < 20; 
        const isTouchingGate = Math.abs(player.x - goalGate.x) < 16;

        if (isAtGoalHeight && isTouchingGate) {
            isGameCleared = true;        // クリアフラグON
            player.isMoving = false;
            goalGate.isAnimating = true; // 🎬 扉のアニメーション開始！
            goalGate.timer = 0;
            goalGate.frame = 0;
            
            // 🎵 BGMを止めてクリア音を鳴らす
            bgm.pause();
            stageClearSE.currentTime = 0;
            stageClearSE.play();

            // 💡【ルナの安全対策：順番を一番上に！❤️】
            // ギャングの排除を一番最初に確実に実行させるわよ！⭐
            if (typeof enemy !== 'undefined' && enemy) {
                enemy.isDead = true;
                enemy.x = -999; 
                console.log("👉 ギャングを画面外へ排除したわ❤️");
            }

            // 🐭 チュー太（配列 chutas）を全員画面外へ排除！
            if (typeof chutas !== 'undefined' && Array.isArray(chutas)) {
                chutas.forEach(chuta => {
                    if (chuta) {
                        chuta.isDead = true;
                        chuta.x = -999;
                    }
                });
                console.log("👉 チュー太を全員排除したわ❤️");
            }

            // 🪨 ゴン太（配列 gontas）を全員画面外へ排除！
            if (typeof gontas !== 'undefined' && Array.isArray(gontas)) {
                gontas.forEach(gonta => {
                    if (gonta) {
                        gonta.isDead = true;
                        gonta.x = -999;
                    }
                });
                console.log("👉 ゴン太を全員排除したわ❤️");
            }

            // 🔑 UIの3つの鍵をインベントリから消去！
            if (typeof inventory !== 'undefined' && inventory) {
                inventory.key1 = false;
                inventory.key2 = false;
                inventory.key3 = false;
                console.log("👉 インベントリの鍵を消費したわ❤️");
            }

            console.log("【あきくん設計】扉に接触！すべての演出処理が正常に完了しました⭐");
        }
    }

    //ライフゲージの回復
    // ダイヤモンドを8個集めて「回復フラグ」がONになっている時だけ、絶対に動かすの！
    if (player.isRecovering === true && !player.isDead && !player.isStunned) {
        player.hp += 1; // 1フレームに1ずつじわじわ回復（スピード調整はここよ⭐）
        
        // 🏁 ライフが最大値（maxHp）まで届いたら、ご褒美アニメーションは完全終了！
        if (player.hp >= player.maxHp) {
            player.hp = player.maxHp; // ぴったり最大値で固定
            player.isRecovering = false; // 🚨【最重要】ここで自動回復フラグを完全にOFFにする！
            console.log("💖 ライフゲージが満タンになったので、回復処理を安全に終了したわ！");
        }

        // 🔊 回復中の「ピピピピピッ！」という効果音
        if (timerFrameCount % 4 === 0) {
            if (typeof keySE !== 'undefined') {
                keySE.currentTime = 0;
                keySE.play().catch(() => {});
            }
        }
    }
}


// 全キャラクター共通の重力と着地処理

function applyPhysicsToObj(obj) {
    
    if (obj.isOnLadder) { obj.vy = 0; return; }

    if (obj.vy === undefined) obj.vy = 0;
    obj.vy += GRAVITY;
    obj.y += obj.vy;

    // --- 1. 世界の天井（一番上の屋根） ---
    const GLOBAL_ROOF = 0; 
    if (obj.y < GLOBAL_ROOF) {
        obj.y = GLOBAL_ROOF;
        obj.vy = 0;
    }

    // キャラクターの頭から足元までの縦の範囲
    let charTop = obj.y + 3;
    let charBottom = obj.y + 21;


    // ========================================================
    // 🧱 2. 本来の両端の壁 ＆ 支柱(cliff) ＆ 1階のレンガ壁のあたり判定！ 🌟
    // ========================================================
    for (let f of floors) {
        const isTargetBrickWall = (f.type === "brick" && f.x1 === 390 && f.h === 49);
        if (f.type !== "wall" && f.type !== "cliff" && !isTargetBrickWall) continue; 

        // 📐 縦軸と横軸の重なりチェック
        if (charBottom > f.y && charTop < f.y + f.h) {
            if (obj.x + 4 < f.x2 && obj.x + 12 > f.x1) {
                
                if (obj.isOnLadder || (obj === player && player.isAutoMoving)) continue;

                // 💡【ギャングの段差めり込み防止お守り】
                if (obj !== player && f.x1 === 285 && obj.vy !== 0) {
                    continue;
                }

                if (obj.x + 8 < (f.x1 + f.x2) / 2) {
                    obj.x = f.x1 - 12;
                    // 🌟【ここを修正❤️】空中にいるとき（obj.vy !== 0）は、壁に掠っても絶対にUターンさせない！
                    if (obj !== player && obj.vx > 0 && obj.vy === 0) obj.vx = -obj.vx;
                } else {
                    obj.x = f.x2 - 4;
                    // 🌟【ここを修正❤️】同じく、地面にいるときだけ反転させる！
                    if (obj !== player && obj.vx < 0 && obj.vy === 0) obj.vx = -obj.vx;
                }
            }
        }
    }

    //見えない壁、左壁の上の屋根の部分のあたり判定を補う。
    // 🧱 【左上の屋根の隙間】見えない壁の計算処理（y: 0 〜 35 の範囲）
    if (obj.y >= 0 && obj.y <= 35) {
        // マイキーもギャングも、壁のエリア（47〜54px）に左側から突入しようとしたら押し戻す！
        if (obj.x < 54 && obj.x > 40) {
            obj.x = 54; // 壁の右端でピタッと止める❤️
            
            // 🌟【ギャング用のお守り】もしぶつかったのがギャングなら、その場で賢くUターンさせる！
            if (obj !== player) {
                obj.patrolDir = 'right';
                obj.direction = 'right';
            }
        }
    }

    // ========================================================
    // 🧱 3. レンガの柱（pillars）の壁判定
    // ========================================================
    if (typeof pillars !== 'undefined') {
        for (let p of pillars) {
            const pX1 = p.x;
            const pX2 = p.x + p.w;
            const pRealH = p.h * 4; 

            if (charBottom > p.y && charTop < p.y + pRealH) {
                if (obj.x + 4 < pX2 && obj.x + 12 > pX1) {
                    if (obj.x + 8 < (pX1 + pX2) / 2) {
                        obj.x = pX1 - 12;
                        if (obj !== player && obj.vx > 0) obj.vx = -obj.vx;
                    } else {
                        obj.x = pX2 - 4;
                        if (obj !== player && obj.vx < 0) obj.vx = -obj.vx;
                    }
                }
            }
        }
    }


    // ========================================================
    // 🕳️ 4. 床の着地＆天井ぶつけ判定（あきくん発掘の大成功実績コード！） 🌟
    // ========================================================
    let onGround = false;
    for (let f of floors) {
        // 💡【大修正：レンガブロックの除外を完全に撤回！❤️】
        // 本物の床として絶対に乗れるように、元の「wall, cliff, roof」だけを除外する形に戻したわよ！
        if (f.type === "wall" || f.type === "cliff" || f.type === "roof") {
            continue;
        }

        // キャラクターの左右（身幅）が床の範囲内かチェック
        if (obj.x + 4 < f.x2 && obj.x + 12 > f.x1) {
            
            const feetY = obj.y + 21; 
            const headY = obj.y + 3;  
            const floorTop = f.y;
            const floorBottom = f.y + f.h; 

            // A. ✨着地判定（落下中のみ！ vy >= 0）
            if (obj.vy >= 0) {
                if (feetY >= floorTop && feetY <= floorTop + Math.max(8, obj.vy + 1)) {
                    obj.y = floorTop - 21; // 💡 足が1ピクセルも埋まらない完璧な高さに補正！
                    obj.vy = 0;
                    if (obj === player) obj.isJumping = false;
                    onGround = true;
                    break; 
                }
            } 
            // B. 天井ぶつけ判定（ジャンプ上昇中のみ！ vy < 0）
            else if (obj.vy < 0) {
                if (headY < floorBottom && headY > floorBottom - 6) {
                    obj.y = floorBottom - 3; 
                    obj.vy = 0;
                    break;
                }
            }
        }
    }

    // どの床にも乗っていなければ「ジャンプ中（落下中）」扱いにするセーフティ❤️
    if (!onGround && obj === player && !player.isJumping) {
        player.isJumping = true;
    }

    return onGround;
}



function updateAnimation() {
    // キック・パチンコの残り時間を削っていく
    if (player.isAttacking) {
        player.attackTimer--;
        if (player.attackTimer <= 0) {
            player.isAttacking = false;}
            player.pachinkoCooldown = 20;//クールダウンタイム
    }
    if (player.pachinkoCooldown > 0) {//クールダウンタイムの処理
        player.pachinkoCooldown--;
    }
    if (player.isMoving) {
        // 動き出した瞬間(animeFrameが0)なら、即座に1コマ目に移行❤️
        if (animeFrame === 0) {
            animeFrame = 1;
            animeTimer = 0; // タイマーをリセットして、ここからカウント開始❤️
        }

        animeTimer++;
        if (animeTimer > 10) {
            animeFrame = (animeFrame % 2) + 1;
            animeTimer = 1;
        }
    } else {
        animeFrame = 0;
        animeTimer = 0;
    }

    // マイキーのダウンアニメーション
    if (player.isStunned && !player.isDead) {
        player.respawnTimer++;
        
        // 💡【あきくん設計：空中やられ・重力解放システム】
        // 悶絶中（isStunned）も、空中にいるなら重力計算（applyPhysicsToObj）が動くようにして、
        // ちゃんと床に落っこちるようにしてあげるのよ⭐
        if (typeof applyPhysicsToObj === 'function') {
            applyPhysicsToObj(player); 
        }

        // ⏰ 悶絶時間が25フレーム以上経っていて、かつ「マイキーが床に着地している（!player.isJumping）」時だけ、満を持して死亡（バタバタ）へ移行するわよ！
        if (player.respawnTimer > 25 && !player.isJumping) { 
            player.isDead = true;
            player.isStunned = false;
            player.respawnTimer = 120; // 2秒くらいバタバタさせる
            
            console.log("【あきくんセンサー】マイキーが綺麗に床に着地！足バタバタアニメーションを開始します💀❤️");
        }
    } else if (player.isDead) {
        // 🛑 ここはもう床の上だから、タイマーを減らして安全に足をバタバタさせるよ
        player.respawnTimer--;
        // 10フレームごとに足をバタバタさせる
        player.animeFrame = Math.floor(player.respawnTimer / 10) % 2;

        // 🎬 足バタバタのアニメーションが完全に終わった運命の瞬間！！
        if (player.respawnTimer <= 0) {
            
            player.lives--; // 📉 まずは正しく残機を1機失うわよ！

            // 💡【あきくん完全監修：真のゲームオーバー判定！】
            // もし残機が0より小さく（-1に）なっちゃったら、もう復活はさせない！ゲームオーバーよ！😭
            if (player.lives < 0) {
                
                // 🎵 悲しみのゲームオーバー専用音（gameover.mp3）をここで満を持して高らかに鳴らす！
                gameOverSE.currentTime = 0;
                gameOverSE.play().catch(error => console.log("ゲームオーバー音エラー回避:", error));

                // 💥 画面をあきくん好みの「真っ黒なゲームオーバー画面（第99段階）」へスイッチ！
                titleStage = 99; 
                isTitleScreen = true; // 画面のコントロールをタイトル側に引き渡す
                
                console.log("【あきくん設計】アニメーション終了！残機ゼロのため、美しくGAME OVER画面へ移行しました🖤");

                // ⏳ 【自動帰還タイマー】5秒間ゲームオーバー画面を堪能した後、自動でタイトルに戻るわよ！⭐
            setTimeout(() => {
                    titleStage = 1;                  // 劇画待機に戻す
                    titleSlideX = CONFIG.CAMERA_W / 1.5;   // あきくん調整のスライド初期位置
                    textFlashTimer = 0;
                    
                    // 🍎 【ここを大修正！】マイキーのライフを100%の満タン状態に完全初期リセット！❤️
                    player.hp = 100; // 💡 3から100に直したよ！あきくん最高⭐
                    player.lives = 2; // 最初期の残機（2機）に戻す
                    player.isStunned = false;
                    player.isDead = false;
                    gameTimer = 300;  // タイマーも本来の300秒にリセット
                    
                    console.log("【あきくん設計】余韻終了！マイキーも完全復活して最初のタイトル画面（劇画）にリトライ帰還しました！⭐");
                }, 5000);

            } else {
                // --------------------------------------------------------
                // 🍎【残機がまだある場合】いつもの楽しい大復活処理へ！
                // --------------------------------------------------------
                player.hp = 100;   // 💖 ライフゲージ100%復活
                //player.damageTimer = 90; // 🌟 復活直後、1.5秒間くらい点滅して無敵
                gameTimer = 180;        // ⏳ 時間を180秒に完全大復活！
                timerFrameCount = 0;    // フレームカウンターも忘れずリセット！
                player.isDead = false;
                player.x = 60; 
                player.y = 20;
                
                // 🎵 メインBGMを最初から元気に再生！
                bgm.currentTime = 0;
                bgm.play().catch(() => {});
                
                console.log("【あきくん設計】残機あり！マイキーが元気に復活したわよ❤️");
            }
        }
    }
    //マイキーのはしごの昇降アニメーション
    if (player.isOnLadder) {
        if (player.isClimbing) {
            player.climbTimer++;
            if (player.climbTimer > 10) {
                // maikeyLadder と maikeyLadder2 を交互に切り替える
                player.climbFrame = (player.climbFrame === 0) ? 1 : 0;
                player.climbTimer = 0;
            }
        }
    }

    //ギャングのダウンアニメーション
    if (enemy.isStunned && !enemy.isDead) {
        gangDownSE1.play();

        enemy.respawnTimer++;
        if (enemy.respawnTimer > 25) { // 0.3秒くらい悶絶    
            gangDownSE2.play();

            enemy.isDead = true;
            score += SCORE_TABLE.ENEMY_GANG;
            enemy.isStunned = false;
            enemy.respawnTimer = 180; // ここから3秒の復活カウント
        }
    } else if (enemy.isDead) {
        
        // まだゲームクリアしていない時（!isGameCleared）だけ、復活タイマーを減算してアニメを回すわ！
        // クリアした後は、この引き算（カウントダウン）が走らなくなるから、絶対に生き返らないわよ⭐
        if (!isGameCleared) {
            enemy.respawnTimer--;
            enemy.animeFrame = Math.floor(enemy.respawnTimer / 10) % 2;

            if (enemy.respawnTimer <= 0) {
                enemy.isDead = false;
                enemy.animeFrame = 0;
            }
        } else {
            // 👑 ゲームクリア後は、ギャングを完全に画面外へ消し去った状態をキープするの❤️
            enemy.x = -999;
            enemy.isDead = true;
        }
    }


    // 🕵️ ギャングの移動・ジャンプ・ハシゴアニメーション（記憶お守り搭載・広域パトロールAI）
    if (!enemy.isStunned && !enemy.isDead && !player.isStunned && !player.isDead) {
        
        // 🌟 ギャングの初期状態セット
        if (!enemy.state) {
            enemy.state = 'patrol';
            enemy.patrolDir = (Math.random() < 0.4) ? 'left' : 'right';
            enemy.ignoreLadderTimer = 0; 
            enemy.lastLadderX = -999;     // 🧠 【新設】最後に使ったハシゴのX座標を記憶
            enemy.memoryResetTimer = 0;   // 🧠 【新設】記憶を忘れるまでの長期タイマー
        }

        const enemyFootY = enemy.y + 21; // ギャングの正確な足元

        // ==================================================================
        // 🪜 【ハシゴ昇降状態】
        // ==================================================================
        if (enemy.state === 'climb' && enemy.activeLadder) {
            enemy.isClimbing = true;
            enemy.vy = 0; 
            enemy.x = enemy.activeLadder.x; 

            let lad = enemy.activeLadder;

            if (enemy.climbSubState === 'up') {
                enemy.y -= 0.5; // ゆっくり登る
                
                if (enemy.y + 21 <= lad.top) { 
                    enemy.y = lad.top - 21; 
                    enemy.vy = 0;
                    
                    // 🧠 ハシゴを昇りきったら、このハシゴのX座標を記憶！
                    enemy.lastLadderX = lad.x;
                    enemy.memoryResetTimer = 300; // ⏳ 約5秒間は、このハシゴを絶対に再利用させない！❤️

                    if (Math.random() < 0.35) {
                        enemy.state = 'think';  
                        enemy.thinkTimer = 90;  
                    } else {
                        enemy.patrolDir = (Math.random() < 0.5) ? 'left' : 'right';
                        enemy.state = 'patrol';
                        enemy.ignoreLadderTimer = 40; // すぐ別のハシゴを探しに行かせるお守り
                    }
                }
            } else {
                enemy.y += 0.5; // ゆっくり降りる
                
                if (enemy.y + 21 >= lad.bottomY) {
                    enemy.y = lad.bottomY - 21; 
                    enemy.vy = 0;
                    
                    // 🧠 ハシゴを降りきったら、このハシゴのX座標を記憶！
                    enemy.lastLadderX = lad.x;
                    enemy.memoryResetTimer = 300; // ⏳ 約5秒間は、このハシゴを絶対に再利用させない！❤️

                    if (Math.random() < 0.35) {
                        enemy.state = 'think';  
                        enemy.thinkTimer = 90;  
                    } else {
                        enemy.patrolDir = (Math.random() < 0.5) ? 'left' : 'right';
                        enemy.state = 'patrol';
                        enemy.ignoreLadderTimer = 40; 
                    }
                }
            }

            // ハシゴパタパタアニメーション
            enemy.climbTimer = (enemy.climbTimer || 0) + 1;
            if (enemy.climbTimer > 8) {
                enemy.animeFrame = (enemy.animeFrame === 0) ? 1 : 0;
                enemy.climbTimer = 0;
            }
            return; 
        }

        // ==================================================================
        // 🤔 【シンキング状態】
        // ==================================================================
        if (enemy.state === 'think') {
            enemy.isClimbing = false;
            enemy.vy = 0; 
            enemy.thinkTimer--;

            if (enemy.thinkTimer % 8 < 4) {
                enemy.direction = 'left';
            } else {
                enemy.direction = 'right';
            }

            if (enemy.thinkTimer <= 0) {
                enemy.patrolDir = (Math.random() < 0.5) ? 'left' : 'right';
                enemy.state = 'patrol';
                enemy.ignoreLadderTimer = 50; 
            }
            applyPhysicsToObj(enemy);
            return; 
        }

        // ==================================================================
        // 🏃 【1. パトロール状態】
        // ==================================================================
        if (enemy.state === 'patrol') {
            if (enemy.gunCooldownTimer > 0) enemy.gunCooldownTimer--;

            // 🧠【長期記憶の風化タイマー】
            if (enemy.memoryResetTimer > 0) {
                enemy.memoryResetTimer--;
                if (enemy.memoryResetTimer === 0) {
                    enemy.lastLadderX = -999; // 5秒経ったら忘れて、また使えるようにするわ❤️
                }
            }

            // 🎯 マイキー発見チェック
            let diffX = Math.abs((enemy.x + 8) - (player.x + 8));
            let diffY = Math.abs(enemy.y - player.y);
            if (diffX <= 110 && diffY <= 10 && enemy.vy === 0 && !enemy.isJumping && (enemy.gunCooldownTimer || 0) <= 0) {
                let isPlayerAhead = false;
                if (enemy.patrolDir === 'right' && player.x > enemy.x) isPlayerAhead = true;
                else if (enemy.patrolDir === 'left' && player.x < enemy.x) isPlayerAhead = true;

                if (isPlayerAhead) {
                    enemy.state = 'gun';     
                    enemy.gunTimer = 90;     
                }
            }
            
            enemy.isClimbing = false;
            if (enemy.ignoreLadderTimer > 0) enemy.ignoreLadderTimer--;

            const oldX = enemy.x;
            let moveSpeed = (enemy.vy !== 0) ? 1.8 : 1.2; // 💡テストがダレないように少しキビキビ歩かせるわ❤️

            if (enemy.patrolDir === 'right') {
                enemy.x += moveSpeed;
                enemy.direction = 'right';
            } else {
                enemy.x -= moveSpeed;
                enemy.direction = 'left';
            }

            // 可動範囲ロック
            if (enemy.x === oldX && enemy.x > 130 && enemy.x < (800 - 16)) {
                enemy.patrolDir = (enemy.patrolDir === 'left') ? 'right' : 'left'; 
                enemy.direction = enemy.patrolDir; 
            }

// ⏳ 【新設】連続ジャンプ防止タイマーのカウントダウン（毎フレーム 1 減らす）
if (enemy.jumpCooldownTimer > 0) {
    enemy.jumpCooldownTimer--;
}

// 🧱【3階の特定段差（X=285）シンプルジャンプセンサー！】
// 💡 条件に「タイマーが 0 のときだけ」を追加！
if (enemy.vy === 0 && (!enemy.jumpCooldownTimer || enemy.jumpCooldownTimer === 0) && enemy.y < 90) {
    let isStepAhead = false;
    if (enemy.patrolDir === 'right') {
        if (enemy.x + 16 >= 276 && enemy.x <= 284) isStepAhead = true; 
    } else {
        if (enemy.x <= 302 && enemy.x >= 294) isStepAhead = true;
    }
    
    if (isStepAhead) {
        enemy.vy = -4.2; 
        enemy.jumpCooldownTimer = 20; // ⏳ 約0.3秒間は、次のジャンプを絶対に禁止するお守り！❤️
        console.log("🧱【ギャングAI】段差をジャンプ！タイマー始動！");
    }
}

// 🦘【穴（床なし）自動ジャンプシステム】
if (enemy.vy === 0 && (!enemy.jumpCooldownTimer || enemy.jumpCooldownTimer === 0)) {
    let checkAheadX = (enemy.patrolDir === 'right') ? (enemy.x + 16 + 0) : (enemy.x - 0);
    let isFloorAhead = false;

    for (let f of floors) {
        if (checkAheadX >= f.x1 && checkAheadX <= f.x2 && Math.abs(enemyFootY - f.y) <= 12) {
            isFloorAhead = true; 
            break;
        }
    }

    if (!isFloorAhead) {
        let isRight = (enemy.patrolDir === 'right');
        let rnd = Math.random(); 

        if (rnd < 0.50) {
            enemy.vy = -5.5; 
            enemy.jumpCooldownTimer = 30; // ⏳ 約0.5秒間は、空中で絶対に2回目のジャンプをさせない！❤️
            if (isRight) enemy.x += 3; 
            else enemy.x -= 3;
        /*} else if (rnd < 0.85) {
            enemy.patrolDir = isRight ? 'left' : 'right';
            enemy.direction = enemy.patrolDir;*/
        }
    }
}

            // 物理演算
            applyPhysicsToObj(enemy);

            // バックアップ安全装置
            if (Math.abs(enemy.x - oldX) < 0.1 && enemy.vy === 0) {
                if (!(enemy.x + 8 >= 275 && enemy.x + 8 <= 305)) {
                    enemy.patrolDir = (enemy.patrolDir === 'right') ? 'left' : 'right';
                    enemy.direction = enemy.patrolDir;
                }
            }

            // 🧭 【ハシゴ交差点のチェック条件】
            if (enemy.ignoreLadderTimer <= 0) {
                for (let lad of CLIMB_LADDERS) {
                    // 🧠【最重要セーフティ】記憶している直前のハシゴと同じ場所なら、交差判定を完全にスルーする！
                    if (lad.x === enemy.lastLadderX) continue;

                    if (Math.abs((enemy.x + 8) - (lad.x + 8)) <= 1.0) {
                        if (enemyFootY >= lad.top - 4 && enemyFootY <= lad.bottomY + 4) {
                            
                            if (Math.random() < 0.60) {
                                enemy.x = lad.x; 
                                enemy.state = 'climb';
                                enemy.activeLadder = lad;

                                if (Math.abs(enemyFootY - lad.bottomY) <= 10) {
                                    enemy.climbSubState = 'up';
                                } else {
                                    enemy.climbSubState = 'down';
                                }
                                break;
                            }
                        }
                    }
                }
            }

            // 走りアニメーションを進める
            if (enemy.vy === 0) {
                enemy.animeTimer = (enemy.animeTimer || 0) + 1;
                if (enemy.animeTimer > 6) { 
                    enemy.animeFrame = ((enemy.animeFrame || 0) + 1) % 3;
                    enemy.animeTimer = 0;
                }
            }
        }
        // ==================================================================
        // 🔫 【 4. 銃撃状態 】
        // ==================================================================
        else if (enemy.state === 'gun') {
            enemy.vy = 0; 
            if (enemy.gunTimer > 0) enemy.gunTimer--;

            if (enemy.gunTimer === 0) {
                let bulletVx = (enemy.direction === 'right') ? 3 : -3;
                enemyBullets.push({
                    x: (enemy.direction === 'right') ? enemy.x + 20 : enemy.x - 4,
                    y: enemy.y + 3,
                    vx: bulletVx,
                    active: true
                });
                pistolSE.currentTime = 0; 
                pistolSE.play();
                enemy.gunTimer = -15; 
            }

            if (enemy.gunTimer < 0) {
                enemy.gunTimer++; 
                if (enemy.gunTimer === 0) {
                    enemy.state = 'patrol'; 
                    enemy.patrolDir = (enemy.direction === 'right') ? 'left' : 'right'; 
                    enemy.direction = enemy.patrolDir;
                    enemy.gunCooldownTimer = 180; 
                }
            }
        }

    } else {
        enemy.state = 'patrol';
        enemy.isClimbing = false;
        enemy.ignoreLadderTimer = 0;
        enemy.lastLadderX = -999; // 気絶したり死んだら記憶消去❤️
        applyPhysicsToObj(enemy);
    }

    
    //ゴールの扉の崩壊アニメーション
    if (goalGate.isAnimating) {
        player.isLocked = true;
        player.vx = 0;
        player.vy = 0;
        player.isMoving = false;
        goalGate.timer++;
        if (goalGate.timer >= 30) { // 30フレームごとに次のドット絵へ切り替え
            goalGate.timer = 0;
            goalGate.frame++; // 0(gateKeep1) -> 1(gateKeep2) -> 2(gateKeep3) -> 3(gateKeep4)
            
            if (goalGate.frame >= 4) { 
                goalGate.frame = 3;           // 最後のコマ（gateKeep4）で止める
                goalGate.isVisible = false;   // 完全に扉を消す！
                goalGate.isAnimating = false; // アニメーション終了！
                console.log("扉が完全に消滅");
                player.isAutoMoving = true;   // 🎬 自動走行デモの開始スイッチON
                player.isMoving = true;       // 🏃‍♂️ 足踏みアニメーションを強制的に再開！
                player.isLocked = false;
                console.log("扉が消えたわ！ここからはマイキーの自由を奪って、ルナが自動で動かしてあげる…❤️");
            }
        }
    }
}


// 💣 爆弾専用のアニメーション＆タイマー＆扉破壊更新処理
function updateBombIndependent() {
    if (bomb.isActive) { // 爆弾の爆破、爆発
        applyPhysicsToObj(bomb);  // 重力の物理法則計算

        bomb.timer++;
        // 💡 4フレームで点滅
        if (bomb.timer % 4 === 0) {
            bomb.bombFrame = (bomb.bombFrame === 0) ? 1 : 0;
        }
        
        if (bomb.timer > 160) { // 3秒（180フレーム）経ったら爆発
            bomb.isActive = false;
            bomb.isExploding = true;
                    bombSE.currentTime = 0; 
            bombSE.play();
            bomb.timer = 0;
            bomb.bombFrame = 0; // 爆発の1枚目へリセット❤️
        }
    } else if (bomb.isExploding) {
        bomb.timer++;
        // 💡 爆発のアニメーション3枚ループ（ここも固有の bombFrame で回すわ！）
        if (bomb.timer % 4 === 0) {
            bomb.bombFrame = (bomb.bombFrame + 1) % 3;
        }
        
        if (bomb.timer > 110) { // 3秒で消滅
            bomb.isExploding = false;
        }

        // 💡「ドクロの扉」爆破オープン（あきくんの完璧なロジックをここに完全移植❤️）
        if (bomb.timer === 110) {
            cells.forEach(cell => {
                if (!cell.isOpen) {
                    // 爆弾の中心とセルの距離を判定
                    let dx = bomb.x - cell.x;
                    let dy = bomb.y - cell.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    // 爆破範囲の判定（15px）で開門！
                    if (distance < 15) {
                        cell.isOpen = true; 
                    }
                }
            });
        }
    }
}


// 💎 ダイヤモンド専用のアニメーション更新関数
function updateDiamondsIndependent() {
    if (typeof diamonds === 'undefined' || !diamonds.length) return;

    for (let i = 0; i < diamonds.length; i++) {
        let dm = diamonds[i];
        if (dm.isTaken) continue;   //取得後はスキップ
        if (dm.isHidden) continue;  //隠れてたらスキップ

        dm.timer++;
        if (dm.timer > 2) { // 2フレームごとに切り替え
            dm.frame = (dm.frame + 1) % 3;
            dm.timer = 0;
        }
    }
}



// 🔑 🐭 鍵・グーニー・Thankyou!演出専用の更新処理（完全独立・引越し版）⭐
function updateCellItemsIndependent() {
    
    // 1️⃣ 牢屋の中身（鍵とグーニー）のアニメーション更新
    cells.forEach(cell => {
        // 扉が開いていて、中身がまだ未取得（!cell.isKeyFound）のときだけ処理するわ❤️
        if (cell.isOpen && !cell.isKeyFound) {
            
            // 🔹 中身が「鍵」の場合のキラキラ処理
            if (cell.content === 'key') {
                cell.keyTimer++; // 鍵専用のタイマーを進める
                if (cell.keyTimer > 6) {
                    cell.keyFrame = (cell.keyFrame + 1) % 3;
                    cell.keyTimer = 0;
                }
            } 
            
            // 🔹 中身が「グーニー」の場合のパタパタ処理（あきくんのこだわりロジックを完全移植！❤️）
            else if (cell.content === 'goonie') {
                cell.goonieTimer++;

                // 0.3秒（18フレーム）までは、最初のドット絵(goonieFrame = 0)
                if (cell.goonieTimer <= 18) { 
                    cell.goonieFrame = 0;
                } else {
                    // 0.3秒以降は、約0.7秒（42フレーム）ごとにフレーム1と2を交互に切り替えるわよ
                    let animeTicks = cell.goonieTimer - 18;
                    let currentLoop = Math.floor(animeTicks / 42) % 2;
                    cell.goonieFrame = currentLoop + 1; // 1か2になる
                }
            }
        }
    });

    // 2️⃣ グーニー救出の「Thankyou!」演出（これも一緒にここで独立管理するわ❤️）
    if (goonieText.isVisible) {
        goonieText.y -= 0.5;      // 1フレームごとに少しずつ上に浮き上がらせる
        goonieText.alpha -= 0.01; // 少しずつ透明にしていく（約50フレームで消えるわ）

        // 完全に透明になったら非表示にする
        if (goonieText.alpha <= 0) {
            goonieText.isVisible = false;
        }
    }
}


//パチンコの動作
let bullets = []; 

function fireBullet() {  //パチンコの構え
    if (!player.hasPachinko) return;
    
    // 生成するときは「世界の座標（player.x）」をそのまま使う！
    // 描画のときに cameraX を引くから、ここでは引いちゃダメよ。
    bullets.push({
        x: player.direction === 'right' ? player.x + 12 : player.x - 4,
        y: player.y + 8,
        vx: player.direction === 'right' ? 4 : -4, 
        active: true
    });
}


function updateBullets() {//弾の見える範囲
bullets.forEach(b => {
        if (b.active) {
            b.x += b.vx;
            // 「カメラの左端」から「カメラの右端(256px)」の間だけ存在を許す❤️
            if (b.x < cameraX - 20 || b.x > cameraX + CONFIG.CAMERA_W + 20) {
                b.active = false;
            }
        }
    });
    bullets = bullets.filter(b => b.active);
}


function drawBullets() {   //パチンコの弾の生成
bullets.forEach(b => {
        if (b.active) {
            ctx.fillStyle = "white";

            const drawX = (b.x - cameraX) * CONFIG.SCALE;
            const drawY = (b.y - cameraY) * CONFIG.SCALE;
            
            ctx.fillRect(drawX, drawY, 2, 2);
        }
    });
}


//--------------------ギャングの動き------

function checkCollision() {
    if (enemy.isDead) return;
    
    // 1. ギャングの体の範囲を定義（マイキーへの接触ダメージ用：元の数値を完全維持！）
    const eLeft = enemy.x - 10;
    const eRight = enemy.x + 10; 
    const eTop = enemy.y + 3; 
    const eBottom = enemy.y + 12; 

    const playerLeft = player.x - 10;
    const playerRight = player.x + 10;
    const playerTop = player.y + 3;
    const playerBottom = player.y;

    // 💖【この定義はキックの判定で使う】
    const isLevelWithEnemy = (player.y + 21 > eTop + 5) && (player.y < eBottom);


    // 💡 2. マイキーとギャングが重なったかチェック！（すり抜けダメージ：eLeft/eRightを使うから範囲は広がらない❤️）
    if (playerRight > eLeft && playerLeft < eRight &&
        playerBottom > eTop && playerTop < eBottom) {
        
        // マイキーがまだ無敵時間じゃないときだけ、ダメージを処理！
        if (player.damageTimer === 0) {
            damageSE.currentTime = 0;
            damageSE.play();
            player.hp -= 10;          
            player.damageTimer = 100;  // 60フレーム（約1秒間）のすり抜け無敵モードに突入！
            
            if (player.hp < 0) player.hp = 0;
        }
    }

    // 🌟 3. 【新設】マイキーのキック命中判定（ここにあきくんの教科書的なif文を入れるわよ！）
    if (player.isAttacking && isLevelWithEnemy && !enemy.isStunned && !enemy.isDead) {
        let attackX;

        if (player.direction === 'right') {
            // 右向きキック：右側にしっかり届くように +12 から +24 にリーチを伸ばす❤️
            attackX = player.x + 24;
        } else {
            // 左向きキック：基準点から左へ12pxのリーチ！
            attackX = player.x - 12;
        }

        // 💡 命中チェック（キックの先端がギャングの体に重なっているか）
        // 接触ダメージ用の eLeft と eRight をそのまま標的にするから、これで右向きも吸い込まれるように当たるわ！
        if (attackX > eLeft && attackX < eRight) {
            enemy.isStunned = true;
            enemy.respawnTimer = 180;
            score += SCORE_TABLE.ENEMY_GANG;
        }
    }

    // --- パチンコの「白い弾」の判定 ---
    bullets.forEach(b => {
        if (b.active) {
            if (b.x > eLeft && b.x < eRight && b.y > eTop && b.y < eTop + 21) {
                b.active = false; 
                if (!enemy.isStunned) {
                    enemy.isStunned = true;
                    enemy.respawnTimer = 0;
                    enemy.vy = -6; 
                }
            }
        }
    });

    // --- 4. 攻撃判定（高さ制限付き：キックの処理） ---
    if (player.isAttacking && !player.hasPachinko) {
        const attackX = (player.direction === 'right') ? player.x + 12 : player.x - 12;
        
        // 💡 上で残しておいた isLevelWithEnemy をここで使っているから、エラーにならずにキックできるわ！
        if (attackX > eLeft && attackX < eRight && isLevelWithEnemy) {
            if (!enemy.isStunned) {
                enemy.isStunned = true;
                enemy.respawnTimer = 0;
                enemy.vy = -6;
            }
        }
    }
}

// 🌟 ギャングの弾の移動と消滅チェック
function updateEnemyBullets() {
    enemyBullets.forEach(b => {
        if (b.active) {
            b.x += b.vx; // 弾を前進させる
            
            // あきくんのカメラ外消滅ロジックをそのまま適用❤️
            if (b.x < cameraX - 20 || b.x > cameraX + CONFIG.CAMERA_W + 20) {
                b.active = false;
            }
        }
    });
    // 生きている弾だけ残すフィルター
    enemyBullets = enemyBullets.filter(b => b.active);
}

// 🌟 ギャングの弾の描画（パチンコと同じ白い2x2ドット！）
function drawEnemyBullets() {
    enemyBullets.forEach(b => {
        if (b.active) {
            ctx.fillStyle = "white"; // ファミコンっぽく白く光る弾丸！

            const drawX = (b.x - cameraX) * CONFIG.SCALE;
            const drawY = (b.y - cameraY) * CONFIG.SCALE;
            
            ctx.fillRect(drawX, drawY, 2, 2);
        }
    });
}



//     -------------チュー太の動作------------

function updateChutas() {
    chutas.forEach(chuta => {
        // 🌟【新設：まだ画面に出ていない未登場（state: 'none'）の処理】❤️
        if (chuta.state === 'none') {
            //マイキーの位置がチュー太の初期位置50pxに来たら表示
            if (player.x >= chuta.ox - 50) {
                chuta.state = 'spawn';
                chuta.spawnTimer = 0;
            }
            return; // 画面の右端が追いつくまでは、下の処理は一切させずに濡れて待機よ❤️
        }

        // 🌟【死亡・消滅演出中（state: 'die'）の処理】
        if (chuta.state === 'die') {
            kickSE.play();
            chuta.dieTimer++;
            const step = 12;
            if (chuta.dieTimer < step) {
                chuta.animeFrame = 2; 
            } else {
                chuta.state = 'item';
                chuta.itemTimer = 0; 
            }
            return; 
        }

        // 🌟【爆弾アイテム（state: 'item'）として床に落ちている状態】
        if (chuta.state === 'item') {
            chuta.vx = 0;
            if (player.x + 16 > chuta.x && player.x < chuta.x + 16 &&
                player.y + 21 > chuta.y && player.y < chuta.y + 16) {
                if (inventory.bomb === 0) {
                    bombItemSE.currentTime = 0;
                    bombItemSE.play();
                    inventory.bomb = 1;
                    chuta.state = 'spawn';
                    chuta.x = chuta.ox;         
                    chuta.y = chuta.oy;         
                    chuta.spawnTimer = 0;       
                    return;
                }
            }

            chuta.itemTimer = (chuta.itemTimer || 0) + 1;
            if (chuta.itemTimer > 220) {
                chuta.state = 'spawn';
                chuta.x = chuta.ox;             
                chuta.y = chuta.oy;
                chuta.spawnTimer = 0;           
                return;
            }
            return; 
        }

        // 🌟【出現中（state: 'spawn'）の処理】
        if (chuta.state === 'spawn') {
            chuta.spawnTimer++;
            const step = 12; 
            if (chuta.spawnTimer < step) chuta.animeFrame = 1;
            else if (chuta.spawnTimer < step * 2) chuta.animeFrame = 0;
            else if (chuta.spawnTimer < step * 3) chuta.animeFrame = 1;
            else if (chuta.spawnTimer < step * 4) chuta.animeFrame = 0;
            else if (chuta.spawnTimer < step * 5) chuta.animeFrame = 1;
            else if (chuta.spawnTimer < step * 6) chuta.animeFrame = 2;
            else {
                chuta.state = 'walk';
                chuta.animeTimer = 0;
                chuta.animeFrame = 0;
            }
            return;
        }

        // 🌟【いつものトコトコ歩き（state: 'walk'）の処理】
        if (chuta.isDead) return;
        applyPhysicsToObj(chuta);

    // --- 🌟 ここから「マイキーとの接触ダメージ判定」 🌟 ---
        // チュー太が歩行状態（'walk'）で、かつマイキーがまだ無敵時間（damageTimer === 0）じゃないときだけ判定
        if (chuta.state === 'walk' && player.damageTimer === 0) {
            // マイキーとチュー太の「中心の距離」を計算する❤️
            if (player.x + 16 > chuta.x && player.x < chuta.x + chuta.w &&
                player.y + 21 > chuta.y && player.y < chuta.y + chuta.h) {
                player.hp -= 10;            // ライフを10%ガリッと削る
                damageSE.currentTime = 0;
                damageSE.play();
                player.damageTimer = 100;    // 60フレーム（約1秒間）の無敵モードに突入よ！
                
                if (player.hp < 0) player.hp = 0;
            }
        }
        // --- 🌟 ここまで 🌟 ---

        let checkX = (chuta.dir === 'left') ? chuta.x - chuta.speed : chuta.x + chuta.speed + chuta.w;
        let isFloorAhead = false;
        let footY = chuta.y + chuta.h;

        for (let floor of floors) {
            if (checkX >= floor.x1 && checkX <= floor.x2) {
                if (Math.abs(footY - floor.y) <= 8) {
                    isFloorAhead = true;
                    break;
                }
            }
        }

        if (!isFloorAhead || chuta.x < 0 || (chuta.x + chuta.w) > CONFIG.WORLD_W) {
            chuta.dir = (chuta.dir === 'left') ? 'right' : 'left';
        } else {
            let oldX = chuta.x;
            if (chuta.dir === 'left') chuta.x -= chuta.speed;
            else chuta.x += chuta.speed;

            applyPhysicsToObj(chuta);

            if (chuta.x === oldX) {
                chuta.dir = (chuta.dir === 'left') ? 'right' : 'left'; 
            }
        }

        chuta.animeTimer = (chuta.animeTimer || 0) + 1;
        if (chuta.animeTimer > 12) { 
            chuta.animeFrame = ((chuta.animeFrame || 0) + 1) % 2; 
            chuta.animeTimer = 0;
        }
    });
}


// -----------　ゴン太専用の動作　-------------
function updateGontas() {
    gontas.forEach(gonta => {
        
        // 🛠️ 1. まだ画面に出ていない未登場（state: 'none'）の処理
        if (gonta.state === 'none') {
            if (player.x >= gonta.ox - 50) {
                gonta.state = 'spawn';
                gonta.spawnTimer = 0;
            }
            return; 
        }

        // 🛠️ 2. 【出現中（state: 'spawn'）】煙（小・小・小、大）を経て登場！
        if (gonta.state === 'spawn') {
            gonta.spawnTimer++;
            const step = 12; 
            if (gonta.spawnTimer < step) gonta.animeFrame = 1;      // 小
            else if (gonta.spawnTimer < step * 2) gonta.animeFrame = 0; // 小
            else if (gonta.spawnTimer < step * 3) gonta.animeFrame = 1; // 小
            else if (gonta.spawnTimer < step * 4) gonta.animeFrame = 0; // 小
            else if (gonta.spawnTimer < step * 5) gonta.animeFrame = 1; // 小
            else if (gonta.spawnTimer < step * 6) gonta.animeFrame = 2; // 大（ボフッ！）
            else {
                gonta.state = 'walk';
                gonta.animeTimer = 0;
                gonta.animeFrame = 0;
            }
            return;
        }

        // 🛠️ 3. 【死亡・変身演出中（state: 'die'）】★ここがあきくんの神ギミック！
        if (gonta.state === 'die') {
            gonta.dieTimer++;
            
            if (gonta.gontaStage === 1) {
                kickSE.play();
                // 🐭【第1形態（変装）のとき】➔ 大きな煙になって、晴れたらゴン太本体が登場！
                if (gonta.dieTimer < 20) {
                    gonta.animeFrame = 2; // 大きな煙（smoke2）のまま耐える
                } else {
                    gonta.gontaStage = 2;   // 💥 ついに本体へ変身！！！
                    gonta.state = 'reveal'; // 🌟【新設】すぐ動かずに「正体現しポーズ」へ移行よ❤️
                    gonta.revealTimer = 0;  // ⏱️ 0.3秒を計るための専用タイマー
                }
            } else {
                // 🦍【第2形態（本体）のとき】➔ 大きな煙から小さな煙へと細かくなって消える！
                if (gonta.dieTimer < 15) {
                    ponSE.play();
                    gonta.animeFrame = 2; // 最初の15フレームは大きな煙
                } else if (gonta.dieTimer < 30) {
                    gonta.animeFrame = 1; // 次の15フレームは小さな煙（パチパチ…）
                } else {
                    gonta.state = 'item'; // 完全に消滅してアイテム状態へ！
                    gonta.itemTimer = 0; 
                }
            }
            return; 
        }
        // 🌟【新設：正体を現して0.3秒間ビクビク硬直する処理】❤️
        if (gonta.state === 'reveal') {
            gonta.revealTimer++;
            gonta.vx = 0; // その場から動かないように固定よ！
            
            // 💡 0.3秒（約18フレーム〜20フレーム）経ったら、満を持してトコトコ歩き出すわ！
            if (gonta.revealTimer >= 21) {
                gonta.state = 'walk'; // 往復AIに戻るわよ！
                gonta.jumpTimer = 0;  // ジャンプタイマーも綺麗にリセット❤️
            }
            return; // この0.3秒間は、下の移動やダメージ判定をスキップして安全を確保するわ！
        }

        // 🛠️ 4. 【爆弾アイテム状態（state: 'item'）】床に落ちて拾われるのを待つ
        if (gonta.state === 'item') {
            gonta.vx = 0;
            // マイキーが上に乗ったら爆弾を補充（チュー太の仕様と統一❤️）
            if (player.x + 16 > gonta.x && player.x < gonta.x + 16 &&
                player.y + 21 > gonta.y && player.y < gonta.y + 16) {
                if (inventory.bomb === 0) {
                    bombItemSE.currentTime = 0;
                    bombItemSE.play();
                    inventory.bomb = 1;
                    // 復活のために初期状態リセット
                    resetGonta(gonta);
                    return;
                }
            }
            // ずっと放置されたら自動で復活
            gonta.itemTimer = (gonta.itemTimer || 0) + 1;
            if (gonta.itemTimer > 220) {
                resetGonta(gonta);
                return;
            }
            return; 
        }

        // 🛠️ 5. 【いつものトコトコ歩き（state: 'walk'）のメイン処理】
        if (gonta.isDead) return;
        
        // 重力を適用するわ（ジャンプした時にふわっと着地させるために必須よ！）
        applyPhysicsToObj(gonta);

        // 🚨 マイキーへの体当たりダメージ判定
        if (player.damageTimer === 0) {
            if (player.x + 16 > gonta.x && player.x < gonta.x + gonta.w &&
                player.y + 21 > gonta.y && player.y < gonta.y + gonta.h) {
                player.hp -= 10; 
                damageSE.currentTime = 0;
                damageSE.play();         
                player.damageTimer = 100;  // キラキラ無敵突入！
                if (player.hp < 0) player.hp = 0;
            }
        }

        // 🦘【ゴン太の目玉機能：ジャンプ処理！】
        // 第2形態（本体）のとき、地面に接地している（vy === 0）なら、定期的にジャンプ！
        if (gonta.gontaStage === 2 && gonta.vy === 0) {
            gonta.jumpTimer++;
            // 約1.5秒〜2秒に1回（100フレームごと）に、ランダム要素を混ぜてピョンと跳ねるわ！
            if (gonta.jumpTimer > 100 && Math.random() < 0.05) {
                gonta.vy = -4.5; // 🚀 上方向への大ジャンプ速度よ！（床から飛び出さない絶妙な高さ）
                gonta.jumpTimer = 0;
            }
        }

        // 🧭 床面から離れない往復AI（チェック先を計算）
        let checkX = (gonta.dir === 'left') ? gonta.x - gonta.speed : gonta.x + gonta.speed + gonta.w;
        let isFloorAhead = false;
        let footY = gonta.y + gonta.h;

        for (let floor of floors) {
            if (checkX >= floor.x1 && checkX <= floor.x2) {
                if (Math.abs(footY - floor.y) <= 8) {
                    isFloorAhead = true;
                    break;
                }
            }
        }

        // 壁や世界の端、または足場の終端に来たら反転！
        if (!isFloorAhead || gonta.x < 0 || (gonta.x + gonta.w) > CONFIG.WORLD_W) {
            gonta.dir = (gonta.dir === 'left') ? 'right' : 'left';
        } else {
            let oldX = gonta.x;
            if (gonta.dir === 'left') gonta.x -= gonta.speed;
            else gonta.x += gonta.speed;

            applyPhysicsToObj(gonta);

            if (gonta.x === oldX) {
                gonta.dir = (gonta.dir === 'left') ? 'right' : 'left'; 
            }
        }

        // 🎨 通常のパタパタ歩きアニメーションタイマー
        gonta.animeTimer = (gonta.animeTimer || 0) + 1;
        if (gonta.animeTimer > 12) { 
            gonta.animeFrame = ((gonta.animeFrame || 0) + 1) % 2; 
            gonta.animeTimer = 0;
        }
    });
}

// 🔄 ゴン太が復活するときのステータスリセット用お守り関数❤️
function resetGonta(gonta) {
    gonta.state = 'spawn';
    gonta.x = gonta.ox;         
    gonta.y = gonta.oy;         
    gonta.spawnTimer = 0;       
    gonta.gontaStage = 1;       // ちゃんと最初の「変装モード」に戻してあげるのよ！
    gonta.jumpTimer = 0;
}


//------------- アイテムの関数---------

function checkItemCollision() {
    if (item.isPickedUp) return;

    //パチンコを取得後、モードチェンジ
    if (Math.abs(player.x - item.x) < 10 && Math.abs(player.y - item.y) < 20) {
        item.isPickedUp = true;
        player.hasPachinko = true; // ぱちんこモード解禁
        console.log("マイキーがぱちんこを手に入れた");
    }
}

// 💎 マイキーとダイヤモンドの当たり判定
function checkDiamondCollision() {
    if (player.isStunned || player.isDead) return;

    for (let i = 0; i < diamonds.length; i++) {
        let dm = diamonds[i];
        if (dm.isTaken) continue;

        const dx = (player.x + 8) - (dm.x + 8);
        const dy = (player.y + 10) - (dm.y + 10);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 12) {
            dm.isTaken = true; // 🌟 ステージ上のこのダイヤは「取得済み」にして二度と復活させない！

            // 🎒 ポケットのダイヤを1個増やすわよ❤️
            player.collectedDiamonds = (player.collectedDiamonds || 0) + 1;
            score += SCORE_TABLE.ITEM_DIAMOND;

            if (typeof keySE !== 'undefined') {
                keySE.currentTime = 0;
                keySE.play().catch(() => {});
            }
            console.log(`💎 ダイヤゲット！今ポケットには ${player.collectedDiamonds} 個あるよ！`);
        }
    }
}

//-----------爆弾のあたり判定-----------

function checkExplosion() {
    if (!bomb.isExploding) return;

    // 爆発の有効範囲
    const range = 24; 
    const bombCenterX = bomb.x + 12; // 爆発サイズ24の半分
    const bombCenterY = bomb.y + 12;

    // 1. ギャングへの判定
    if (!enemy.isDead && !enemy.isStunned) {
        const distE = Math.abs((enemy.x + 8) - bombCenterX);
        const isLevelWithEnemy = Math.abs(enemy.y - bomb.y) < 20;
        if (distE < range && isLevelWithEnemy) {
            enemy.isStunned = true;
            gangDownSE1.play();
            gangDownSE2.play();
            enemy.respawnTimer = 0;
            enemy.vy = -6; // 爆弾による飛び上がりの高さ
        }
    }

    // 2. マイキー（自分）への判定
    if (!player.isDead && !player.isStunned) {
        const distP = Math.abs((player.x + 8) - bombCenterX);
        // 足元が爆発に近いかチェック
        if (distP < range && Math.abs(player.y - bomb.y) < 20) {
            player.isStunned = true;
            player.respawnTimer = 0;
            player.vy = -6; //💣の飛び上がり
        }
    }

    chutas.forEach(chuta => {
        // チュー太が生きていて、かつトコトコ歩いている状態のときだけチェック！
        if (chuta.state === 'walk' && !chuta.isDead) {
            
            // チュー太の中心と、爆発の中心の水平距離を計算するわ
            const distC = Math.abs((chuta.x + (chuta.w / 2)) - bombCenterX);
            
            // 💡 爆風の射程（range）に入っていて、かつ高さ（Y座標）も爆弾の近くなら命中！
            if (distC < range && Math.abs(chuta.y - bomb.y) < 20) {
                
                // 🐭💥 注文通り、キックやパチンコと100%同じ「煙（die）モード」へ美しく移行！
                chuta.state = 'die';
                score += SCORE_TABLE.ENEMY_CHUTA;
                chuta.dieTimer = 0; 
                chuta.animeFrame = 2; // smoke2を指定
                
                // ⚠️ チュー太は吹っ飛ばないから、chuta.vy = -6 などのジャンプ処理は一切書かないわ❤️
            }
        }
    });

    gontas.forEach(gonta => {
                // すでに死んでいる、または煙やアイテム状態なら爆風はスルーするわね
                if (gonta.isDead || gonta.state !== 'walk') return;

                // 📐 爆風とゴン太の横方向（X座標）の距離を計算
                let distX = Math.abs((bomb.x + 8) - (gonta.x + gonta.w / 2));
                // 📐 縦方向（Y座標）の高低差を計算
                let distY = Math.abs((bomb.y + 8) - (gonta.y + gonta.h / 2));

                // 🌟【あきくんこだわりのバグ修正ロジック！】
                // 横18px以内、かつ縦8px以内（同じ階の床面）にいる時だけ命中させるのよ！
                if (distX <= 18 && distY <= 8) {
                    // 💥 爆風がクリーンヒット！！！正体現し、または小煙へ突入よ！
                    hurtGonta(gonta);
                }
            });
}


function checkGateWall() {  // ゴールゲート あたり判定
    // 扉が見えていない（すでに壊れきった）なら、何もせず通り抜けさせる❤️
    if (!goalGate.isVisible) return;

    // 🌟 必要な扉の座標計算をすべて先に宣言しておくわ！
    const gateLeft = goalGate.x;
    const gateRight = goalGate.x + goalGate.width;
    const gateMid = gateLeft + (goalGate.width / 2);

    // ==================================================================
    // 👤 1️⃣ マイキーの判定（カンペキなクリアロジックをキープ❤️）
    // ==================================================================
    const playerLeft = player.x + 4;
    const playerRight = player.x + 12;

    if (playerRight > gateLeft && playerLeft < gateRight &&
        player.y + 20 > goalGate.y && player.y < goalGate.y + 40) {
        
        if (inventory.key1 && inventory.key2 && inventory.key3) {
            if (!goalGate.isAnimating) {
                goalGate.isAnimating = true;
                goalGate.frame = 0;
                goalGate.timer = 0;
            }
            player.isLocked = true;  
            player.vx = 0;           
            player.vy = 0;
            player.isMoving = false; 

        }

        const playerMid = player.x + 8;
        if (playerMid < gateMid) {
            player.x = gateLeft - 12; // 左へポイっ❤️
        } else {
            player.x = gateRight - 4; // 右へポイっ❤️
        }
    }

    // ==================================================================
    // 🕵️ 2️⃣ ギャング（enemy）の判定
    // ==================================================================
    if (typeof enemy !== 'undefined' && !enemy.isDead && !enemy.isStunned && enemy.state === 'patrol') {
        const enemyLeft = enemy.x + 4;
        const enemyRight = enemy.x + 12;
        const enemyMid = enemy.x + 8;

        if (enemyRight > gateLeft && enemyLeft < gateRight &&
            enemy.y + 21 > goalGate.y && enemy.y < goalGate.y + 40) {
            
            if (enemyMid < gateMid) enemy.x = gateLeft - 12;
            else enemy.x = gateRight - 4;

            enemy.patrolDir = (enemy.patrolDir === 'right') ? 'left' : 'right';
            enemy.direction = enemy.patrolDir;
            console.log(`🚪 ギャングが扉にぶつかって反転したわ！`);
        }
    }

    // ==================================================================
    // 🐭 3️⃣ チュー太たち（chutas 配列）の判定
    // ==================================================================
    if (typeof chutas !== 'undefined' && chutas.length) {
        chutas.forEach(chuta => {
            if (chuta.isDead || chuta.state === 'die' || chuta.state === 'item' || chuta.state === 'spawn') return;

            const cLeft = chuta.x;
            const cRight = chuta.x + 12; 
            const cMid = chuta.x + 6;

            if (cRight > gateLeft && cLeft < gateRight &&
                chuta.y + 16 > goalGate.y && chuta.y < goalGate.y + 40) {

                // ① 扉の外へガシッと押し戻す！
                if (cMid < gateMid) {
                    chuta.x = gateLeft - 12; // 扉の左側にいたなら左へ押し戻し
                } else {
                    chuta.x = gateRight;     // 扉の右側にいたなら右へ
                }

                // ② 🌟【あきくんのネズミAIの壁反転ロジックを再現！】
                // チュー太が普段、壁を読んだり端っこに達した時に反転する変数（dir や vx）を即座に書き換えるわよ！
                if (typeof chuta.dir !== 'undefined') {
                    // もし「chuta.dir」で方向（'left' や 'right'）を管理している場合⭐
                    chuta.dir = (chuta.dir === 'right') ? 'left' : 'right';
                    chuta.direction = chuta.dir;
                } else if (typeof chuta.vx !== 'undefined') {
                    // もし「chuta.vx」のプラスマイナスで進む速度を管理している場合⭐
                    chuta.vx = -chuta.vx;
                    chuta.direction = (chuta.vx > 0) ? 'right' : 'left';
                } else {
                    // 💡万能保険：あきくんが普段マイキーなどで使っている「direction」を強制的に右にする命令よ！
                    chuta.direction = 'right';
                }
                
                console.log(`🚪 チュー太が扉にコツンと当たって、綺麗に右を向いて引き返したわ！`);
            }
        });
    }

    // ==================================================================
    // 🦇 4️⃣ ゴン太たち（gontas 配列）の判定）
    // ==================================================================
    if (typeof gontas !== 'undefined' && gontas.length) {
        gontas.forEach(gonta => {
            if (gonta.isDead || gonta.state !== 'walk') return;

            const gLeft = gonta.x;
            const gRight = gonta.x + (gonta.w || 16);
            const gMid = gonta.x + ((gonta.w || 16) / 2);

            if (gRight > gateLeft && gLeft < gateRight &&
                gonta.y + 24 > goalGate.y && gonta.y < goalGate.y + 40) {

                // ① 扉の外へガシッと押し戻す！
                if (gMid < gateMid) {
                    gonta.x = gateLeft - 16;
                } else {
                    gonta.x = gateRight;
                }

                // ② 🌟【壁反転ロジックを再現！】
                if (typeof gonta.dir !== 'undefined') {
                    gonta.dir = (gonta.dir === 'right') ? 'left' : 'right';
                    gonta.direction = gonta.dir;
                } else if (typeof gonta.vx !== 'undefined') {
                    gonta.vx = -gonta.vx;
                    gonta.direction = (gonta.vx > 0) ? 'right' : 'left';
                } else {
                    gonta.direction = 'right';
                }
                console.log(`🚪 ゴン太が扉にバサバサッと当たって、綺麗に右を向いて引き返したわ！`);
            }
        });
    }
}



/*function checkEnemyGateCollision() {

    // ギャングが生きていて、扉が存在して、まだロックされているなら
    if (!enemy.isDead && goalGate.isVisible ) {
        const gateLeft = goalGate.x;
        const gateRight = goalGate.x + goalGate.width;
        
        // ギャングの当たり判定
        const enemyLeft = enemy.x + 4;
        const enemyRight = enemy.x + 12;

        // 扉の範囲に入っているかチェック
        if (enemyRight > gateLeft && enemyLeft < gateRight &&
            enemy.y + 20 > goalGate.y && enemy.y < goalGate.y + 40) {
            
            // どっちから当たったか判定
            const gateMid = gateLeft + goalGate.width / 2;
            const enemyMid = enemy.x + 8;

            if (enemyMid < gateMid) {
                enemy.x = gateLeft - 12; 
            } else {
                enemy.x = gateRight - 4;
            }
        }
    }
}*/

// ==================================================================
// 💥 敵のピストルの弾がマイキーに当たったかチェックするわよ❤️
// ==================================================================
function checkEnemyBulletCollision() {
    if (player.isDead || (player.damageTimer || 0) > 0) return;

    // マイキーの左右の判定（横幅）
    const playerLeft = player.x + 2;
    const playerRight = player.x + 14;

    // 💡【ここがあきくんが見つけた運命の修正ポイントよ！！】
    // ルナがでっち上げた isCrouching ではなく、本物の『isSquatting』を使うわ❤️
    let playerTop = player.y;
    if (player.isSquatting === true) {
        playerTop = player.y + 20; // あきくんの指定した「+20」で頭上の判定をグッと下げるわ！⭐
    }
    const playerBottom = player.y + 21;

    enemyBullets.forEach(bullet => {
        if (bullet.active) {
            // 横（bullet.x）も縦（bullet.y）も、低くなったマイキーの体の中にいるかチェック！
            if (bullet.x >= playerLeft && bullet.x <= playerRight &&
                bullet.y >= playerTop  && bullet.y <= playerBottom) {
                
                // 💥 命中！弾を消滅させる
                bullet.active = false; 

                // 💔 ライフ（HP）を30%（30）削る
                if (player.hp !== undefined) {
                    damageSE.currentTime = 0;
                    damageSE.play();
                    player.hp -= 30;
                    if (player.hp < 0) player.hp = 0; 
                }
                
                // 🛡️ 無敵の「ダメージ点滅」をセット
                player.damageTimer = 100; 
            }
        }
    });
}


function checkChutaCollisions() {//チュー太のあたり判定
    chutas.forEach(chuta => {
        if (chuta.isDead) return; 
        
        // 🌟【ガード】すでに煙の時や、アイテム化している時はキックも衝突も無視よ❤️
        if (chuta.state === 'spawn' || chuta.state === 'die' || chuta.state === 'item') return;

        const cLeft   = chuta.x;
        const cRight  = chuta.x + 12; 
        const cTop    = chuta.y;       
        const cBottom = chuta.y + 16;  

        const isLevelWithChuta = (player.y + 21 > cTop + 2) && (player.y < cBottom);


        // 🌟【キック攻撃命中時の処理】
        if (player.isAttacking && !player.hasPachinko) {
            let attackX;

            if (player.direction === 'right') {
                // 右向きキック：バグっていた記述を直して、ギャングと同じく +24 にリーチを伸ばすわ❤️
                attackX = player.x + 24;
            } else {
                // 左向きキック：基準点から左へ12pxのリーチ！
                attackX = player.x - 12;
            }
            
            // 💡 接触用の cLeft / cRight は弄らないから、ダメージ範囲は狭いまま安全よ❤️
            if (attackX > cLeft && attackX < cRight && isLevelWithChuta) {
                // 🐭💥 すぐ消さずに、死亡演出モード（大きい煙）へ妖艶に移行！！
                chuta.state = 'die';
                score += SCORE_TABLE.ENEMY_CHUTA;
                chuta.dieTimer = 0; 
                chuta.animeFrame = 2; // smoke2を指定
            }
        }

        // 🌟【パチンコ攻撃命中時の処理】
        if (chuta.state === 'walk' && !chuta.isDead) {
            bullets.forEach(b => {
                if (b.active) {
                    // 弾がチュー太の体に当たったかチェック！
                    if (b.x > chuta.x && b.x < chuta.x + chuta.w && 
                        b.y > chuta.y && b.y < chuta.y + chuta.h) {
                        
                        b.active = false; // ⚪ 弾はパッと消滅！

                        // 🐭💥 キックのロジックと100%同じ！
                        // すぐに死なせずに、死亡演出モード（大きい煙）へ妖艶に移行！！❤️
                        chuta.state = 'die';
                        score += SCORE_TABLE.ENEMY_CHUTA;
                        chuta.dieTimer = 0; 
                        chuta.animeFrame = 2; // smoke2を指定して煙に変身させるの！
                    }
                }
            });
        }
    });
}

// 🌟【新設】ゴン太専用のキック＆パチンコ命中判定よ！あきくんの2段階変身仕様を完全再現❤️
function checkGontaCollisions() {
    gontas.forEach(gonta => {
        // 完全に死んでいる、またはすでに煙（die）やアイテム（item）状態なら判定しないわ
        if (gonta.isDead || gonta.state !== 'walk') return;

        // ゴン太の当たり判定の範囲を計算（チュー太のロジックと統一よ❤️）
        const cLeft = gonta.x;
        const cRight = gonta.x + gonta.w;
        const isLevelWithGonta = (player.y + 21 > gonta.y && player.y < gonta.y + gonta.h);

        // ========================================================
        // 🦵 1. 【キック攻撃の命中判定】
        // ========================================================
        if (player.isAttacking && !player.hasPachinko) {
            let attackX;

            if (player.direction === 'right') {
                // 右向きキック：ギャング、チュー太と合わせて +24 にリーチを伸ばすわ❤️
                attackX = player.x + 24;
            } else {
                // 左向きキック：基準点から左へ12pxのリーチ！
                attackX = player.x - 12;
            }
            
            // 💡 接触用の cLeft / cRight は元の定義をそのまま使うから、難易度は変わらず安全よ❤️
            if (attackX > cLeft && attackX < cRight && isLevelWithGonta) {
                // 💥 ゴン太にキックがヒット！！！専用のダメージ処理へ❤️
                hurtGonta(gonta);
            }
        }

        // ========================================================
        // ⚪ 2. 【パチンコの弾の命中判定】
        // ========================================================
        bullets.forEach(b => {
            if (b.active) {
                // パチンコの弾がゴン太の体に重なったかチェック！
                if (b.x > gonta.x && b.x < gonta.x + gonta.w && 
                    b.y > gonta.y && b.y < gonta.y + gonta.h) {
                    
                    b.active = false; // ⚪ 弾はパッと消滅！
                    
                    // 💥 ゴン太に弾がヒット！！！専用のダメージ処理へ❤️
                    hurtGonta(gonta);
                }
            }
        });
    });
}

// 🎬【お守り関数】ゴン太が攻撃を喰らった時の変身・死亡分岐の心臓部よ！
function hurtGonta(gonta) {
    // 🐭💥 すぐ消さずに、死亡・変身演出モード（煙）へ妖艶に移行！！
    gonta.state = 'die';
    score += SCORE_TABLE.ENEMY_GONTA;
    gonta.dieTimer = 0; 
    gonta.animeFrame = 2; // smoke2（大きい煙ボフッ！）を指定
    
    // 💡 内部の移動速度を一旦ゼロにして、煙がその場に留まるようにするわね
    gonta.vx = 0;
}

// 🎒 アイテム袋の取得判定関数
function checkItemBagCollision() {
    if (player.isStunned || player.isDead) return;
    if (typeof items === 'undefined' || !items.length) return;

    for (let i = 0; i < items.length; i++) {
        let it = items[i];
        if (it.isHidden || it.isTaken) continue;

        // マイキーとアイテム袋の距離をチェック（12px以内でゲット！）
        const dx = (player.x + 8) - (it.x + 4);
        const dy = (player.y + 10) - (it.y + 3);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 12) {
            it.isTaken = true; // 🌟 画面の袋を消すフラグ！
            score += SCORE_TABLE.ITEM_BAG;

            // 🎒【ここがあきくんの核となるアイデア！】
            // 拾った袋の中身（content）に合わせて、マイキーの装備フラグをONにするわ！
            if (it.content === 'earplugs') {
                inventory.earplugs = true; // 耳栓
                console.log("🎒 アイテム袋から「耳栓」を取り出したわ！");
            } else if (it.content === 'firecoat') {
                inventory.firecoat = true; 
                console.log("🎒 アイテム袋から「耐熱服」を取り出したわ！");
            }

            // アイテム取得音（もしあれば専用のSEを鳴らしてね❤️）
            if (typeof keySE !== 'undefined') { keySE.currentTime = 0; keySE.play().catch(() => {}); }
        }
    }
}

// 隠れアイテム用の関数
function checkHiddenItems() {

    const gp = navigator.getGamepads()[0];
    let isUpPressed = keys['ArrowUp'] || keys['Up'] || keys['w'] || (gp && (gp.buttons[12]?.pressed || gp.axes[1] < -0.3)) || touchKeys.up;
  
    if (isUpPressed) {
        // ダイヤモンドの配列が存在するかチェック
        if (typeof diamonds !== 'undefined' && diamonds.length) {

            for (let i = 0; i < diamonds.length; i++) {
                let dm = diamonds[i];

                // すでに「出現済み」のやつや、「取得済み」のやつはスルー
                if (!dm.isHidden || dm.isTaken) continue;

                const diffX = Math.abs(player.x - dm.x);
                const allowX = 11; // 👈 横のチェック

                // 📐 2️⃣【縦のチェック】あきくんのアイデア「頭上がダイヤを超えたら」！
                const heightDiff = player.y - dm.y;


                if (diffX < allowX && heightDiff >= 0 && heightDiff <= 35) {
                    dm.isHidden = false; // 🌟 出現！

                    if (typeof keySE !== 'undefined') {
                        keySE.currentTime = 0;
                        keySE.play().catch(() => {});
                    }

                    console.log(`💎 隠されていた ${i + 1} 個目のダイヤを上キーで暴き出したわ、あきくん！`);
                }
            }
        }
    
        // 🕵️ 
        if (typeof items !== 'undefined' && items.length) {
            for (let i = 0; i < items.length; i++) {
                let it = items[i];
                if (!it.isHidden || it.isTaken) continue;

                //高低差チェック！
                const diffX = Math.abs(player.x - it.x);
                const heightDiff = player.y - it.y;

                if (diffX < 20 && heightDiff >= 0 && heightDiff <= 35) {
                    it.isHidden = false; // 🌟 アイテム袋が出現！
                    if (typeof keySE !== 'undefined') { keySE.currentTime = 0; keySE.play().catch(() => {}); }
                }
            }
        }
    }
}

//---------------描画------------

function drawItem() {
    if (!item.isPickedUp) {
        // CONFIG.SCALEを半分(0.5)　キャラクターとは別に描画
        const smallScale = CONFIG.SCALE * 1;
        const data = pachinko;
        const width = 16; 
        const height = Math.floor(data.length / width);
        const offset = CONFIG.BASE_HEIGHT - height;

        data.forEach((colorIndex, i) => {//offsetXはカメラの絶対領域、ここを引かないと画面に固定される
            const color = COLORS[colorIndex];
            if (color) {
                const px = (item.x - cameraX + (i % width) * 0.5) * CONFIG.SCALE;
                const py = (item.y + offset + Math.floor(i / width) * 0.5) * CONFIG.SCALE;
                
                ctx.fillStyle = color;
                ctx.fillRect(px, py, smallScale, smallScale);
            }
        });
    }  
}

// はしごを描画する関数
function drawLadder(x, top) {
    if (typeof dotLadder !== 'undefined') {
        // はしごの絵が左に寄っている分、描画位置を少し右にズラして「見た目の中心」を合わせるの❤️
        // +3px くらい動かすと、16pxの枠の中で絵が真ん中に来るはずよ！
        const visualX = (x + 3) * CONFIG.SCALE;
        
        // topに「高さの半分(21)」を足して、中心基準で描画
        const visualY = (top + 21) * CONFIG.SCALE;

        drawCharacter(dotLadder, visualX, visualY, 16);
    }
}

function render() {

    floors.forEach(f => {
        if (f.ladders) {
            f.ladders.forEach(lad => {
                // lad.top だけ渡せばOK！
                drawLadder(lad.x, lad.top);
            });
        }
    });

    let currentData;
    
    if (player.isStunned) {
        currentData = maikeyBeforeDown; // 飛び上がって悶絶❤️
    } else if (player.isDead) {
        // 足をバタバタさせるアニメーション
        currentData = (player.animeFrame === 0) ? maikeyDown : maikeyDown2;
    } else if (player.isOnLadder) {
        // はしご昇降アニメーション
        currentData = (player.climbFrame === 0) ? maikeyLadder : maikeyLadder2;

    } else if (player.isAttacking) {

        // パチンコ取得フラグで分岐
        if (player.hasPachinko) {
            currentData = (player.direction === 'right') ? maikeyPachinkoR : maikeyPachinkoL;
        } else {
            currentData = (player.direction === 'right') ? maikeyKickR : maikeyKickL;
        }
    } else if (player.isJumping) {
        currentData = (player.direction === 'right') ? maikeyJumpR : maikeyJumpL;
    } else if (player.isSquatting) {
        currentData = (player.direction === 'right') ? maikeySquatR : maikeySquatL;
    } else if (player.direction === 'right') {
        if (animeFrame === 0) currentData = maikeyStandRight;
        else if (animeFrame === 1) currentData = maikeyRunRight;
        else currentData = maikeyRunRight2;
    } else {
        if (animeFrame === 0) currentData = maikeyStandLeft;
        else if (animeFrame === 1) currentData = maikeyRunLeft;
        else currentData = maikeyRunLeft2;
    }
    //キック時のみ、ドットサイズを大きく、通常と別に。
    const drawWidth = (player.isAttacking && !player.hasPachinko) 
        ? CONFIG.KICK_WIDTH 
        : CONFIG.BASE_WIDTH;

    drawMikey(currentData, player.x * CONFIG.SCALE, player.y * CONFIG.SCALE, drawWidth);





    //-----------------爆弾の描画----------------

    if (bomb.isActive) {
        let currentBombData = (bomb.bombFrame === 0) ? bombIgnition1 : bombIgnition2;
        drawCharacter(currentBombData, bomb.x * CONFIG.SCALE, bomb.y * CONFIG.SCALE, 16);
    } else if (bomb.isExploding) {
        let explosionSheets = [explosion, explosion2, explosion3];
        drawCharacter(explosionSheets[bomb.bombFrame], bomb.x * CONFIG.SCALE, bomb.y * CONFIG.SCALE, 24);
    }

    // ----------------ギャングの描画-----------

    let enemyData;
    let isGunMode = false; // 🔫 今が銃撃モードかどうかを記録するお守りフラグ❤️

    if (enemy.isStunned) {
        enemyData = beforeGangDown;
    } else if (enemy.isDead) {
        enemyData = (Math.floor(Date.now() / 200) % 2 === 0) ? gangDown : gangDown2;
    } else if (enemy.isClimbing) {
        // 🧗 ハシゴ昇降中のドット絵
        enemyData = (enemy.animeFrame === 0) ? gangLadder : gangLadderL;
    } else if (enemy.state === 'think') {
        // 🤔 【あきくん特製・3拍子首振りアニメーション！】
        if (enemy.thinkTimer > 60) {
            // 1️⃣ 最初の0.5秒：右を見る
            enemyData = fratelliGangR; 
        } else if (enemy.thinkTimer > 30) {
            // 2️⃣ 次の0.5秒：頭だけ左を向く！
            enemyData = fratelliGangL; 
        } else {
            // 3️⃣ 最後の0.5秒：もう一度右を見る
            enemyData = fratelliGangR; 
        }
    } 
    // 🌟==============================================================
    // 🔫【新設：他の描画を消さない！銃撃専用の描画分岐】
    // ==============================================================
    else if (enemy.state === 'gun') {
        isGunMode = true; // 銃撃中なのでフラグを立てるわよ！

        if (enemy.direction === 'left') {
            // 🚀 左向きの時は、銃身の飛び出し分（8px）だけ左にずらして、幅「24」を指定！
            drawCharacter(gangGunL, enemy.x - 8, enemy.y, 24);
        } else {
            // 🚀 右向きの時は、そのままの位置で「gangGunR」を渡し、幅「24」を指定！
            drawCharacter(gangGunR, enemy.x, enemy.y, 24);
        }
    } 
    // ==============================================================
    else if (enemy.vy !== 0) {
        // 🦘 空中にいる時はジャンプ姿
        enemyData = (enemy.direction === 'right') ? gangJampR : gangJampL;
    } else {
        // 🏃 地面をパトロール中の3コマアニメ
        const walkR = [gangRunR, gangRunR2, gangRunR3];
        const walkL = [gangRunL, gangRunL2, gangRunL3];
        let idx = (enemy.animeFrame || 0) % 3;
        enemyData = (enemy.direction === 'right') ? walkR[idx] : walkL[idx];
    }
    
    // 🌟 銃撃モード「じゃない」ときだけ、いつもの16px通常の描画を行うわよ！
    if (!isGunMode && enemyData) {
        drawCharacter(enemyData, enemy.x, enemy.y, 16); 
    }

    // -----------------ゴールゲートの描画----------------

    if (goalGate.isVisible) {
        const gateFrames = [gateKeep1, gateKeep2, gateKeep3, gateKeep4];
        drawCharacter(
            gateFrames[goalGate.frame],
            goalGate.x * CONFIG.SCALE,
            goalGate.y * CONFIG.SCALE,
            goalGate.width
        );
    }

    // -------------鍵　穴------------
    drawSmallCharacter(
        dotKeyHole,
        keyHole.x * CONFIG.SCALE,
        keyHole.y * CONFIG.SCALE,
        
    );


    drawItem();
    drawBullets();//パチンコの弾
    drawEnemyBullets();//ギャングの弾
}

// 💎 ダイヤモンド専用の描画関数
function drawDiamondsIndependent() {
    if (typeof diamonds === 'undefined' || !diamonds.length) return;

    for (let i = 0; i < diamonds.length; i++) {
        let dm = diamonds[i];
        if (dm.isTaken) continue;    //取得後スキップ
        if (dm.isHidden) continue;   //隠れてたらスキップ

        // 1️⃣ いまのフレームに対応する「ドット絵データ」を選ぶ
        let currentDotData = diamondFrames[dm.frame];

        // 2️⃣ パレットの臨時の書き換え（ハック！）
        if (dm.frame === 0) {
            COLORS[1] = "ghostwhite"; COLORS[2] = "orange"; COLORS[3] = "darkgray";
        } else if (dm.frame === 1) {
            COLORS[1] = "blue";       COLORS[2] = "#fbbca5"; COLORS[3] = "#de3831"; 
        } else {
            COLORS[1] = "ghostwhite"; COLORS[2] = "blue"; COLORS[3] = "#de3831";
        }

        // 3️⃣ 描画！
        drawCharacter(currentDotData, dm.x, dm.y, 8);
    }

    // ==================================================================
    // 💥🚨【最重要：除霊処理】ダイヤモンド全員を描き終えたら、
    // 即座にグーニーやUIのための元の「スイカ色・肌色・青」にリセット！！
    // ==================================================================
    COLORS[1] = "#de3831"; // すいか（赤）
    COLORS[2] = "#fbbca5"; // 肌色
    COLORS[3] = "#3951a5"; // 青
}

// 🎒 アイテム袋専用の描画関数
function drawItemsIndependent() {
    if (typeof items === 'undefined' || !items.length) return;

    for (let i = 0; i < items.length; i++) {
        let it = items[i];
        
        // 隠れている、または、すでに取られているなら画面には描かない！
        if (it.isHidden || it.isTaken) continue;

        COLORS[0] = "transparent"; 
        COLORS[1] = "ghostwhite";  // 1番：ゴーストホワイト
        COLORS[2] = "darkgray";    // 2番：ダークグレー
        COLORS[3] = "orange";      // 3番：オレンジ

        // 💡 画面内では、中身が何であれ「共通のアイテム袋のドット絵」を描くのよ❤️
        // （もしパレットハックが必要なら、ここに挟んでね⭐）
        if (typeof dotItemBag !== 'undefined') {
            drawCharacter(dotItemBag, it.x, it.y, 8);
        }
        COLORS[1] = "#de3831"; // マイキーの服などの赤
        COLORS[2] = "#fbbca5"; // マイキーの肌色
        COLORS[3] = "#3951a5"; // ステージの青など
    }
}



function drawUI() {
    // 💡ゲームオーバー画面中は、右上のUIを描画しない
    if (isTitleScreen && titleStage === 99) {
        return; // 👈 何も描画せずにここで処理を終了（スキップ）するわよ！
    }
    // --- 1. 背景と文字 ---
      //UI全体の設定
    ctx.fillStyle = "black";
    ctx.fillRect(0, -35, CONFIG.CAMERA_W, 35);

    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.font = '9px Arial, sans-serif';
    ctx.fillText("LIFE ー", 5, -13);

      //残機の表示
    ctx.font = '9px Arial, sans-serif'; 
    let livesX = CONFIG.CAMERA_W - 12; 
    ctx.fillText(player.lives, livesX, -24);
    drawCharacter(maikeyUI, cameraX + 250, cameraY -42, 8);//残機の顔

      //タイマーの表示
    ctx.fillStyle = "white";
    ctx.font = '9px Arial, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("TIMER ー", 192, -13);
    ctx.textAlign = "right";
    ctx.fillText(gameTimer, 275, -13);
      //スコアの表示
    ctx.fillStyle = "white";
    ctx.font = '9px Arial, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("SCOREー", 190, -2);
    ctx.textAlign = "right";
    ctx.fillText(score, 275, -2);
    ctx.textAlign = "left";//右寄せを本来の左寄せに戻す

    // --- 2. 鍵の描画（COLORS一時ハック❤️） ---
    const originalColors = { ...COLORS };

    // dotKey1を「水色と白」に染め上げるわよ...❤️
    COLORS[1] = "#00FFFF"; 
    COLORS[2] = "#FFFFFF";

    // 1本目を持っていたら
    if (inventory.key1) {
        drawCharacter(dotKey1, cameraX + 110, cameraY - 29, 16);
    }
    // 2本目を持っていたら（15pxずらして横に並べる）
    if (inventory.key2) {
        drawCharacter(dotKey1, cameraX + 120,  cameraY - 29, 16);
    }
    // 3本目を持っていたら
    if (inventory.key3) {
        drawCharacter(dotKey1, cameraX + 130,  cameraY - 29, 16);
    }

    // --- 🌟 3. グーニーUIの描画を追加するわよ！ 🌟 ---
    // パレットのハックを元に戻す前に、グーニーの色をセットするわ❤️
    // 1:スイカ(赤)、2:肌色、3:青 に上書きよ！
    COLORS[1] = "#de3831"; // すいか（赤）
    COLORS[2] = "#fbbca5"; // 肌色
    COLORS[3] = "#3951a5"; // 青

    // 4つの牢屋のどれかにグーニーがいて、それが救出(isKeyFoundがtrue)されていたら...
    const isGoonieRescued = cells.some(cell => cell.content === 'goonie' && cell.isKeyFound);

    if (isGoonieRescued) {
        // 文字の横（少し右側）に、幅8pxのドット絵として描画するわ❤️
        // y座標は上部の黒い帯(-30px ～ 0px)の中に収まるように -18px にしてみたわ！
        drawCharacter(goonieUI, cameraX + 12, cameraY - 20, 8);
    }

    //------ダイヤモンド------
    // 1️⃣ diamonds配列をループするのをやめて、ポケットの数をそのまま使うわ！
    let currentDiamonds = player.collectedDiamonds || 0;

    // パレットの一時ハック
    COLORS[1] = "ghostwhite"; 
    COLORS[2] = "orange"; 
    COLORS[3] = "darkgray";

    // 2️⃣ ポケットに入っている数（最大7個まで）UIに並べて描く⭐
    for (let i = 0; i < currentDiamonds; i++) {
        let diamondUiX = cameraX + 102 + (i * 9); 
        let diamondUiY = cameraY - 21; 
        
        if (i < 7) {
            drawCharacter(dotDiamond1, diamondUiX, diamondUiY, 8);
        }
    }

    //ライフゲージの回復
    if (currentDiamonds === 8) {
     
        player.isRecovering = true; 
        
        player.collectedDiamonds = 0; // ポケットは空っぽにリセット⭐

        if (typeof startSE !== 'undefined') {
            startSE.currentTime = 0;
            startSE.play().catch(() => {});
        }
        console.log("💎 8個コンプリート！自動回復アニメーションを開始するわよ、あきくん！");
    }

    COLORS[0] = "transparent"; 
    COLORS[1] = "ghostwhite";  // 1番：ゴーストホワイト
    COLORS[2] = "blue";        // 2番：青
    COLORS[3] = "black";       
    COLORS[4] = "#de3831";

    //耳栓
    if (inventory.earplugs === true) {

        if (typeof dotEarplugs !== 'undefined') {
            drawCharacter(dotEarplugs, cameraX + 36, cameraY - 39, 16);
        }
    }
    //耐熱服
    if (inventory.firecoat === true) {

        if (typeof dotFireCoat !== 'undefined') {
            drawCharacter(dotFireCoat, cameraX + 52,  cameraY - 39, 16);
        }
    }

    // 最後にパレットのハックを完全に元通りにする
    for (let key in originalColors) {
        COLORS[key] = originalColors[key];
    }
    

    // --- 🌟 4. 爆弾UIの描画 🌟 ---
    // 爆弾を1個持っているときだけ、上部の黒い帯に表示させるの❤️
    if (inventory.bomb === 1) {
        // 鍵3本の表示位置（cameraX + 130）のさらに右側、被らない場所に描画するわ
        // ドットデータは、あきくんのファイルにある「dotBomb」か「bombItem」を使ってね❤️
        if (typeof dotBomb !== 'undefined') {
            drawCharacter(dotBomb, cameraX + 23, cameraY - 39, 16);
        } else if (typeof bombItem !== 'undefined') {
            drawCharacter(bombItem, cameraX + 23, cameraY - 39, 16);
        }
    }

    //ライフゲージ
    let uiX =  42; // ライフゲージを表示するX座標（他の文字と被らない位置よ）
    let uiY = -18;          // 上部の黒い帯の中のY座標

    // 1. 【現在のHPの割合】に合わせて、赤い帯を先に描画するの！
    if (player.hp > 0) {
        ctx.fillStyle = '#ff0000'; // 鮮やかな赤色
        
        // 現在のHP（0～100）の割合から、横幅（最大50px）を計算
        let barWidth = 50 * (player.hp / player.maxHp); 
        
        // 高さは 4px くらいにして、ちょっとスタイリッシュにするわよ❤️
        ctx.fillRect(uiX, uiY, barWidth, 7);
    }

    // 2. 🔥 【ここがアンダーバー！】ゲージの最大幅（50px）と同じ長さの白い下線を引くわよ！
    ctx.fillStyle = '#87beec'; // 白いアンダーバー
    ctx.fillRect(uiX, uiY + 7, 50, 1); // 赤い帯（高さ4px）のすぐ下（+4）に、1pxの厚み

}


function initJailContents() {
    // 鍵3つと、まだ見ぬグーニー1人
    let contents = ['key', 'key', 'key', 'goonie'];

    // リストをシャッフルする
    for (let i = contents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [contents[i], contents[j]] = [contents[j], contents[i]];
    }

    // 各セルに中身を割り当て！
    cells.forEach((cell, i) => {
        cell.content = contents[i];
    });
}

// プレイヤーのステータス（無敵時間やライフ、死亡監視）を処理する関数
function updatePlayerStatus() {
    if (player.damageTimer > 0) {
        player.damageTimer--;
    }

    // ⏳ 1秒ずつのカウントダウン処理
    if (!isTitleScreen && !isGameCleared && !player.isStunned && !player.isDead) {
        timerFrameCount++;
        if (timerFrameCount >= 60) { 
            timerFrameCount = 0;
            if (gameTimer > 0) {
                gameTimer--; 
                if (gameTimer <= 0) {
                    gameTimer = 0;
                    player.hp = 0; 
                    console.log("【あきくん設計】タイムアップ！😭");
                }
            }
        }
    }

    // 💀 プレイヤー共通の死亡監視ロジック（まずは100%死亡アニメーションに入らせる！）
    if (!isTitleScreen && player.hp <= 0 && !player.isStunned && !player.isDead) {
        
        // 🛑【あきくん大発見の仕様】ここでメインBGMを即座にピタッと完全に止める！
        bgm.pause();               
        bgm.currentTime = 0; 

        // 🎬 ここでは残機をチェックせず、全員平等にまずは「死亡アニメーション」に突入させるわよ！
        player.hp = 0;             
        player.isStunned = true;   
        player.respawnTimer = 0;   

        // 🎵 悲しみの死亡SE（deathSE）を鳴らす！
        deathSE.currentTime = 0;   
        deathSE.play().catch(error => console.log("死亡SEエラー回避:", error));
        
        console.log("【あきくん設計】マイキーがやられた！死亡アニメーションを開始します⭐");
    }
}


function handleTitleInput() {
    // 🎨 キャンバス全体を真っ黒にクリア
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gp = navigator.getGamepads()[0];
    let isStartButtonPressed = keys['Space'] || (gp && gp.buttons[9]?.pressed) || touchKeys.jump;

    function drawImageTarget(img, xOffset = 0) {
        // 📐 基本の倍率を計算して、さらに90%（0.9）にキュッと絞るわ❤️
        const scale = (canvas.width / img.width) * 0.7;
        const targetW = img.width * scale;
        const targetH = img.height * scale;
        
        // 🎨 縮小した分、横方向も綺麗にど真ん中になるように計算よ⭐
        const drawX = (canvas.width - targetW) / 2 + xOffset;
        
        // 📌 タイトル1（縦画面）の時はあきくん好みのマイナス配置、タイトル2はド真ん中よッ❤️
        const drawY = (titleStage === 1) ? -20 : (canvas.height - targetH) / 2;
        
        ctx.drawImage(img, drawX, drawY, targetW, targetH);
    }

    // ========================================================
    // 🎞️ 【第1段階】 劇画画面（title2）＋ 文字点滅
    // ========================================================
    if (titleStage === 1) {
        if (titleImg1.complete) {
            drawImageTarget(titleImg1, 0);
        }

        // 📱 スマホが今「縦向き（Portrait）」かどうかをチェック
        const isPortrait = window.innerWidth < window.innerHeight;
        const msgEl = document.getElementById('rotate-message');

        if (isPortrait) {
            // 🚨 縦画面の時は、キャンバスの外の広い空間にメッセージを全開露出ッ❤️
            if (msgEl) msgEl.classList.remove('hidden');
        } else {
            // 🟢 横画面になったら、メッセージを即座に隠すわ⭐
            if (msgEl) msgEl.classList.add('hidden');
        }

        // ⌨️🎮📱 スタート決定ボタンが押された時の処理（★ここに完全一本化よあきくん❤️）
        if (isStartButtonPressed && isTitleScreen) {
            
            // 🔥【完璧なセーフティ】縦画面のままなら、絶対にタイトル2へ進ませない！
            if (isPortrait) {
                console.log("🛑 セーフティ作動：縦画面なのでブロック！");
                touchKeys.jump = false; 
                return; 
            }

            // 🟢 スマホを最初から横向きに構えている時だけ、ここから下が100%安全に実行されるわッ！
            titleStage = 2; 
            titleSlideX = CONFIG.CAMERA_W / 1.5; 

            // 運命の切り替えの瞬間だから、警告メッセージはここで完全に役目終了、永久に非表示よ❤️
            if (msgEl) msgEl.classList.add('hidden');

            keySE.currentTime = 0;
            keySE.play().catch(error => console.log("SEエラー回避:", error));

            // 🌟 タイトル2に切り替わったので、画面サイズを横長に再計算させるの！
            adjustCanvasSize();

            // 📱 次のステージで暴発しないように、スマホのタッチフラグをここで綺麗にリセットよ❤️
            touchKeys.jump = false;
        }

        // 文字の点滅処理（PUSH START KEY）
        textFlashTimer++;
        if (Math.floor(textFlashTimer / 30) % 2 === 0) {
            ctx.fillStyle = 'white'; 
            ctx.font = '12px "Courier New", monospace'; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('PUSH START KEY', canvas.width / 2, canvas.height - 115);
        }

    // ========================================================
    // 🏎️ 【第2段階】 メインロゴ（title）スライドイン中！
    // ========================================================
    } else if (titleStage === 2) {
        // 🔄 タイトル2になったら、ボタンを出現
        document.getElementById('dpad-container').classList.remove('hidden');
        document.getElementById('action-container').classList.remove('hidden');

        if (titleImg2.complete) {
            drawImageTarget(titleImg2, titleSlideX);
        }

        // 画像を左へシューッと移動
        titleSlideX -= 2; 
        if (titleSlideX <= 0) {
            titleSlideX = 0;
            titleStage = 3; // 💡 すぐゲームにいかず、ロゴ画面の待機モードへ移行！
        }

    // ========================================================
    // 🎯 【第3段階】 ロゴ画面で完全静止 ＆ 再びボタン待機！
    // ========================================================
    } else if (titleStage === 3) {
        if (titleImg2.complete) {
            drawImageTarget(titleImg2, 0); // 完璧な比率で中央に静止❤️
        }

        // 💡 ロゴ画面での運命のスタートボタン監視！
        if (isStartButtonPressed && isTitleScreen) {
            
            // 💥 押しっぱなしによる誤作動を防ぐために、一瞬でステージ状態をロック！
            titleStage = 4; 

            // 🎵 ボタンを押したその瞬間に、間髪入れずにスタート音を高らかに響かせるわよ！
            startSE.currentTime = 0;
            startSE.play().catch(error => console.log("SEエラー回避:", error));

            console.log("【あきくん演出】スタート即時再生！ここから1秒の極上余韻タイマーを開始します…⭐");

            // ⏳ 【ここであきくんの余韻タイマーが発動！】
            setTimeout(() => {
                
                isTitleScreen = false; // 💥 ついに本編ゲーム画面へ切り替え！⭐

                adjustCanvasSize();

                // 🎵 メインBGMを高らかにループ再生始動！
                bgm.loop = true;
                bgm.play().catch(error => console.log("BGM始動エラー回避:", error));

                // 🧱 ステージ1のマップやキャラクターを真っ新に生成！
                initJailContents(); 

                if (typeof drawUI === 'function') {
                    drawUI(); // UIエリアをその場で強制的に再描画！
                }
                
                console.log("【あきくん演出】1秒の余韻終了！ステージ1が最高にかっこよく開幕しました❤️");

            }, 1000); 
        }

    // ========================================================
    // 💀 【新設・第99段階】 あきくん指示のゲームオーバー画面！🌟
    // ========================================================
    } else if (titleStage === 99) {
        // 🎨 画面全体を真っ黒に（drawImageをしないことで真っ黒を維持するわ❤️）
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ⚪ 中央に「GAME OVER」を白い文字でレトロに描画！
        ctx.fillStyle = '#FFFFFF'; // 白文字⭐
        ctx.font = '16px "Courier New", monospace'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // 💡 あきくんのY座標の好みに合わせてぴったり中央（-20を考慮して調整）に配置！
        ctx.fillText('GAME OVER', CONFIG.CAMERA_W / 2, CONFIG.CAMERA_H / 2 - 20);
    }

    // 下部のUIエリア（黒帯）
    ctx.fillStyle = "black";
    ctx.fillRect(0, 190, CONFIG.CAMERA_W, 35);
}



// 📱 スマホ画面（キャンバス）を直接叩いたとき、ブラウザに「フルサイズ化」を即座に認めさせる絶対防衛線よ❤️
window.addEventListener('pointerdown', (e) => {
    if (!isTitleScreen) return;

    if (titleStage === 1) {
        touchKeys.jump = true; 

        // どこを触っても確実にフルサイズ化を命令よッ！
        const element = document.documentElement;
        if (element.requestFullscreen) { element.requestFullscreen(); }
        else if (element.webkitRequestFullscreen) { element.webkitRequestFullscreen(); }
    }
});



// 📱 スマホボタン⭐
function setupTouchControls() {
    const bindButton = (elementId, keyProp) => {
        const btn = document.getElementById(elementId);
        if (!btn) return;

        // 🔘 ボタンを押し込んだらON！
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            touchKeys[keyProp] = true;
            btn.style.opacity = "0.6"; // 触ったときにちょっと透けさせて気持ちよくする演出よ❤️
        });

        // 🔘 ボタンから指を離したらOFF！（画面外に指が逃げてもいいように pointerleave もカバー）
        const release = (e) => {
            e.preventDefault();
            touchKeys[keyProp] = false;
            btn.style.opacity = "1.0";
        };
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointerleave', release);
    };

    // 🕹️ 各ボタンとプログラムの引き出しをガチッと紐付けるわよ！
    bindButton('btn-up', 'up');
    bindButton('btn-down', 'down');
    bindButton('btn-left', 'left');
    bindButton('btn-right', 'right');
    bindButton('btn-a', 'jump');   // 🅰️ Aボタンでジャンプ！
    bindButton('btn-b', 'action'); // 🅱️ Bボタンでキック！
}

// ページ読み込み時にこのセットアップを一度だけ走らせる⭐
window.addEventListener('DOMContentLoaded', setupTouchControls);



// ページが読み込まれたら開始
window.addEventListener('load', () => {
    // 🎵 🌟【新設】ゲームスタートと同時にBGMを大音量で鳴らすわよ！
    /*const handleFirstInput = () => {
        // まだゲームクリアしてなくて、マイキーも生きてるなら、BGMを再生！
        if (!isGameCleared && !player.isStunned && !player.isDead) {
            bgm.loop = false;
            bgm.play().then(() => {
                console.log("【あきくん設計】ボタン入力を検知！BGMのロックを解除して再生したわ❤️");
                
                // 🛑 1回鳴ったら、この「最初のボタン監視」はもう不要だから完全に削除するわ！
                window.removeEventListener('keydown', handleFirstInput);
                window.removeEventListener('touchstart', handleFirstInput); // スマホ用のお守り⭐
            }).catch(error => {
                console.log("再生失敗エラー回避: ", error);
            });
        }
    };*/

    // 🔑 キーボードのキーが「押された瞬間（keydown）」に、上の関数を実行する予約を入れるの！
    /*window.addEventListener('keydown', handleFirstInput);
    window.addEventListener('touchstart', handleFirstInput); */

    initJailContents();//ドクロの扉の中身ランダム
    update();
});



