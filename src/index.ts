import Vector from "./Vector";

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const originalHeight = canvas.height;
const originalWidth = canvas.width;

rescale();

ctx.fillStyle = ctx.strokeStyle = "white";

const GRAVITY = 10;
const DAMPING = 0.8;
const RADIUS = 10;
const RESTITUTION = 1;
const EPOCH = Date.now();

class Ball {
    public pos: Vector;
    public vel: Vector;
    public acc: Vector;
    public radius: number;
    public mass: number;

    constructor({ x, y, r, m }: { x: number; y: number; r: number; m: number }) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
        this.radius = r;
        this.mass = m;
    }

    public draw() {
        ctx.beginPath();

        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);

        ctx.closePath();

        ctx.fill();
    }

    public update(dt: number) {
        this.draw();

        this.acc.add(new Vector(0, GRAVITY).multiply(dt));

        this.vel.add(this.acc);

        this.pos.add(this.vel);

        this.acc.multiply(0.5);

        this.vel.multiply(0.99);

        const DAMPING_RATIO = Ball.damper(this);

        if (this.pos.y > canvas.height - this.radius) {
            this.pos.y = canvas.height - this.radius;

            this.vel.y = -this.vel.y * DAMPING_RATIO;
        }

        if (this.pos.y < 0 + this.radius) {
            this.pos.y = 0 + this.radius;

            this.vel.y = -this.vel.y * DAMPING_RATIO;
        }

        if (this.pos.x > canvas.width - this.radius) {
            this.pos.x = canvas.width - this.radius;

            this.vel.x = -this.vel.y * DAMPING_RATIO;
        }

        if (this.pos.x < 0 + this.radius) {
            this.pos.x = 0 + this.radius;

            this.vel.x = -this.vel.x * DAMPING_RATIO;
        }
    }

    public static resolve(a: Ball, b: Ball) {
        const delta = a.pos.clone().subtract(b.pos);

        const d = delta.magnitude;

        const mtd = delta.multiply((a.radius + b.radius - d) / d);

        const im1 = 1 / a.mass;
        const im2 = 1 / b.mass;

        a.pos.add(mtd.multiply(im1 / (im1 + im2)));
        b.pos.subtract(mtd.multiply(im2 / (im1 + im2)));

        const v = a.vel.subtract(b.vel);

        const vn = v.dot(mtd.clone().normalized);

        if (vn > 0) return;

        const i = (-(1 + RESTITUTION) * vn) / (im1 + im2);

        const impulse = mtd.clone().normalized.multiply(i);

        a.vel.add(impulse.multiply(im1));
        b.vel.subtract(impulse.multiply(im2));
    }

    public static damper(ball: Ball) {
        return DAMPING / (2 * Math.sqrt(ball.mass * (ball.mass * ball.acc.y)));
    }
}

const balls: Ball[] = [];

let Δ = 0;
let Ω = 0;

function update(γ: number) {
    if (isPaused) return;

    const θ = γ / 1000;

    Δ = θ - Ω;

    Ω = θ;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mouse.isDown) {
        ctx.moveTo(mouse.ox, mouse.oy);
        ctx.lineTo(mouse.x, mouse.y);

        ctx.stroke();
    }

    balls.forEach((ball) => ball.update(Δ));

    balls.forEach((a, i) => {
        balls.slice(i + 1).forEach((b) => {
            const dx = a.pos.x - b.pos.x;
            const dy = a.pos.y - b.pos.y;

            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < a.radius + b.radius) Ball.resolve(a, b);
        });
    });
}

let isPaused = false;

setInterval(() => update(Date.now() - EPOCH), 1000 / 60);

const mouse = {
    x: 0,
    y: 0,
    isDown: false,
    ox: 0,
    oy: 0,
    lastHeld: 0,
};

window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener("mousedown", () => {
    mouse.ox = mouse.x;
    mouse.oy = mouse.y;

    mouse.isDown = true;
    mouse.lastHeld = Date.now();
});

window.addEventListener("mouseup", () => {
    mouse.isDown = false;

    const isClick = mouse.x === mouse.ox && mouse.y === mouse.oy;

    const ball = new Ball({
        x: isClick ? mouse.x : mouse.ox,
        y: isClick ? mouse.y : mouse.oy,
        m: Math.ceil((Date.now() - mouse.lastHeld) / 1000),
        r: RADIUS + Math.floor(Math.random() * 10 - 5),
    });

    if (isClick) {
        ball.vel.add(new Vector((Math.random() - 0.5) * 5, 0));
    } else {
        const force = new Vector(mouse.ox - mouse.x, mouse.oy - mouse.y).divide(10);

        ball.vel.add(force);
    }

    balls.push(ball);
});

window.addEventListener("blur", () => {
    isPaused = true;
});

window.addEventListener("focus", () => {
    isPaused = false;
});

function getObjectFitSize(contains: boolean, containerWidth: number, containerHeight: number, width: number, height: number) {
    const doRatio = width / height;
    const cRatio = containerWidth / containerHeight;
    let targetWidth = 0;
    let targetHeight = 0;
    const test = contains ? doRatio > cRatio : doRatio < cRatio;

    if (test) {
        targetWidth = containerWidth;
        targetHeight = targetWidth / doRatio;
    } else {
        targetHeight = containerHeight;
        targetWidth = targetHeight * doRatio;
    }

    return {
        width: targetWidth,
        height: targetHeight,
        x: (containerWidth - targetWidth) / 2,
        y: (containerHeight - targetHeight) / 2,
    };
}

function rescale() {
    const dimensions = getObjectFitSize(true, canvas.clientWidth, canvas.clientHeight, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;

    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;

    const ratio = Math.min(canvas.clientWidth / originalWidth, canvas.clientHeight / originalHeight);

    ctx.scale(ratio * dpr, ratio * dpr);
}

window.addEventListener("resize", rescale);
