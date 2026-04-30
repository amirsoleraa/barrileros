import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, RotateCcw, MessageCircle } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { useAppStore } from "@/stores/useAppStore";
import { fmtPrice } from "@/lib/utils";
import styles from "./FacturaPage.module.css";

export function FacturaPage() {
    const navigate = useNavigate();
    const { lastPedido } = useCartStore();
    const { cfg } = useAppStore();

    useEffect(() => {
        document.documentElement.dataset.theme = "dark";
        return () => {
            delete document.documentElement.dataset.theme;
        };
    }, []);

    if (!lastPedido) {
        navigate("/");
        return null;
    }

    const p = lastPedido;

    function buildWhatsappUrl() {
        const num = cfg.whatsappNumero?.replace(/\D/g, "");
        if (!num) return null;

        const items = p.items
            .map(
                (i) =>
                    `• ${i.qty}× ${i.nombre}${i.extras?.length ? ` (+${i.extras.join(", ")})` : ""} — ${fmtPrice(i.precio * i.qty)}`,
            )
            .join("\n");

        const dir = [p.cliente.dir, p.cliente.barrio, p.cliente.comp]
            .filter(Boolean)
            .join(", ");

        const msg = [
            `¡Hola ${cfg.nombreComercio}! 🔥 Acabo de hacer un pedido:`,
            ``,
            `📋 *Pedido #${p.numero}*`,
            `👤 ${p.cliente.nombre}`,
            `📞 ${p.cliente.tel}`,
            `📍 ${dir}`,
            ``,
            `🛒 *Productos:*`,
            items,
            ``,
            p.domicilio > 0 ? `🚗 Domicilio: ${fmtPrice(p.domicilio)}` : "",
            p.descuento > 0 ? `🎟 Descuento: -${fmtPrice(p.descuento)}` : "",
            `💰 *Total: ${fmtPrice(p.total)}*`,
        ]
            .filter((l) => l !== "")
            .join("\n");

        return `https://api.whatsapp.com/send/?phone=${num}&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`;
    }

    const whatsappUrl = buildWhatsappUrl();

    return (
        <div className={styles.page}>
            <div className={styles.wrap}>
                <div className={styles.card}>
                    {/* Top verde */}
                    <div className={styles.top}>
                        <div className={styles.check}>
                            <CheckCircle size={32} color="#fff" />
                        </div>
                        <h2>¡Pedido confirmado!</h2>
                        <span className={styles.num}>#{p.numero}</span>
                        <p
                            style={{
                                fontSize: 14,
                                marginTop: 8,
                                opacity: 0.85,
                            }}
                        >
                            {p.mensajeConfirmacion ||
                                "Tu pedido está siendo preparado"}
                        </p>
                    </div>

                    {/* Cuerpo */}
                    <div className={styles.body}>
                        {/* Datos del cliente */}
                        <div className={styles.sec}>
                            <h4>Datos de entrega</h4>
                            <div className={styles.facRow}>
                                <span>Nombre</span>
                                <span className="b">{p.cliente.nombre}</span>
                            </div>
                            <div className={styles.facRow}>
                                <span>Teléfono</span>
                                <span>{p.cliente.tel}</span>
                            </div>
                            <div className={styles.facRow}>
                                <span>Dirección</span>
                                <span>
                                    {p.cliente.dir}
                                    {p.cliente.comp
                                        ? `, ${p.cliente.comp}`
                                        : ""}
                                </span>
                            </div>
                            {p.cliente.recibe && (
                                <div className={styles.facRow}>
                                    <span>Recibe</span>
                                    <span>{p.cliente.recibe}</span>
                                </div>
                            )}
                        </div>

                        {/* Items */}
                        <div className={styles.sec}>
                            <h4>Productos</h4>
                            {p.items.map((item, i) => (
                                <div key={i} className={styles.facRow}>
                                    <span>
                                        {item.nombre} x{item.qty}
                                        {item.extras?.length > 0 && (
                                            <small
                                                style={{
                                                    color: "var(--text3)",
                                                    marginLeft: 4,
                                                }}
                                            >
                                                (+{item.extras.join(", ")})
                                            </small>
                                        )}
                                    </span>
                                    <span>
                                        {fmtPrice(item.precio * item.qty)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Totales */}
                        <div className={`${styles.sec} ${styles.lastSec}`}>
                            <div className={styles.facRow}>
                                <span>Subtotal</span>
                                <span>{fmtPrice(p.subtotal)}</span>
                            </div>
                            {p.domicilio > 0 && (
                                <div className={styles.facRow}>
                                    <span>Domicilio</span>
                                    <span>{fmtPrice(p.domicilio)}</span>
                                </div>
                            )}
                            {p.descuento > 0 && (
                                <div
                                    className={styles.facRow}
                                    style={{ color: "var(--success)" }}
                                >
                                    <span>Descuento</span>
                                    <span>-{fmtPrice(p.descuento)}</span>
                                </div>
                            )}
                            <div
                                className={`${styles.facRow} ${styles.totalRow}`}
                            >
                                <span>Total</span>
                                <span>{fmtPrice(p.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className={styles.actions}>
                    {whatsappUrl && (
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                padding: "15px 20px",
                                borderRadius: 14,
                                fontWeight: 700,
                                fontSize: 16,
                                background: "#25D366",
                                color: "#fff",
                                textDecoration: "none",
                                boxShadow: "0 4px 20px rgba(37,211,102,.4)",
                            }}
                        >
                            <MessageCircle size={20} />
                            Confirmar pedido por WhatsApp
                        </a>
                    )}
                    <button
                        onClick={() => navigate("/")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: "13px 20px",
                            borderRadius: 14,
                            fontWeight: 600,
                            fontSize: 15,
                            background: "transparent",
                            color: "var(--text3)",
                            border: "1.5px solid var(--border)",
                            cursor: "pointer",
                            width: "100%",
                            fontFamily: "inherit",
                        }}
                    >
                        <RotateCcw size={15} />
                        Hacer otro pedido
                    </button>
                </div>
            </div>
        </div>
    );
}
