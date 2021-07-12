import Vector from "./Vector";

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const originalHeight = canvas.height;
const originalWidth = canvas.width;

rescale();

ctx.fillStyle = "white";

const GRAVITY = 15;
const DAMPING = 0.9;
const RADIUS = 10;

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
        // ! DOESNT WORK HELP ME PLS

        const A_RATIO = a.mass / b.mass;
        const B_RATIO = b.mass / a.mass;

        const A_DAMPING_RATIO = Ball.damper(a);
        const B_DAMPING_RATIO = Ball.damper(b);

        a.vel.negate().multiply(A_DAMPING_RATIO).add(new Vector(A_RATIO, A_RATIO).multiply(B_RATIO).negate());
        b.vel.negate().multiply(B_DAMPING_RATIO).add(new Vector(B_RATIO, B_RATIO).multiply(A_RATIO).negate());
    }

    public static damper(ball: Ball) {
        return DAMPING / (2 * Math.sqrt(ball.mass * (ball.mass * ball.acc.y)));
    }
}

const balls = [new Ball({ x: canvas.width / 2, y: canvas.height / 2, r: RADIUS, m: 2 })];

let Δ = 0;
let Ω = 0;

function update(γ: number) {
    const θ = γ / 1000;

    Δ = θ - Ω;

    Ω = θ;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    balls.forEach((ball) => ball.update(Δ));

    balls.forEach((a, i) => {
        balls.slice(i + 1).forEach((b) => {
            const dx = a.pos.x - b.pos.x;
            const dy = a.pos.y - b.pos.y;

            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < a.radius + b.radius) Ball.resolve(a, b);
        });
    });

    requestAnimationFrame(update);
}

requestAnimationFrame(update);

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
        r: RADIUS + Math.floor(Math.random()),
    });

    const force = new Vector(mouse.ox - mouse.x, mouse.oy - mouse.y).divide(10);

    ball.vel.add(force);

    balls.push(ball);
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
