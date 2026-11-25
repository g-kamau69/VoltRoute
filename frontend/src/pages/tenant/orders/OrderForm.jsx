import {useState, useId} from "react";
import { Save } from "lucide-react";


import {
  GlassModalFooter,
} from "../../../components/common/GlassModal";
import {
  createOrder,
  updateOrder,
  getOrderError,
} from "../../../api/tenantOrders";

function initialForm(order){
    return {
        order_number: order?.order_number || "",
        customer_name: order?.customer_name || "",
        customer_phone: order?.customer_phone || "",
        pickup_address: order?.pickup_address || "",
        pickup_latitude: order?.pickup_latitude || "",
        pickup_longitude: order?.pickup_longitude || "",
        delivery_address: order?.delivery_address || "",
        delivery_latitude: order?.delivery_latitude || "",
        delivery_longitude: order?.delivery_longitude || "",
        payload_weight_kg: order?.payload_weight_kg || "",
        priority: order?.priority || "normal",
        delivery_deadline: order?.delivery_deadline || "",
        notes: order?.notes || "",
    };
}

function toLocalDateTime(value){
    if (!value) return "";

    const date = new Date(value);
    const adjusted = new Date (
        date.getTime() - date.getTimezoneOffset() * 60000
    );
    return adjusted.toISOString().slice(0, 16);
}

const fields = [
    {
        name: "order_number",
        label: "Order Number",
        required: true,
    },
    {
        name: "customer_name",
        label: "Customer Name",
    },
    {
        name: "customer_phone",
        label: "Customer Phone",
        type: "tel",
    },
    {
        name: "pickup_address",
        label: "Pickup Address",
        required: true,
        fullWidth: true,
    },
    {
        name: "pickup_latitude",
        label: "Pickup Latitude",
        type: "number",
        min: -90,
        max: 90,
        required: true,
    },
    {
        name: "pickup_longitude",
        label: "Pickup Longitude",
        type: "number",
        min: -180,
        max: 180,
        required: true,
    },
    {
        name: "delivery_address",
        label: "Delivery Address",
        required: true,
        fullWidth: true,
    },
    {
        name: "delivery_latitude",
        label: "Delivery Latitude",
        type: "number",
        min: -90,
        max: 90,
        required: true,
    },
    {
        name: "delivery_longitude",
        label: "Delivery Longitude",
        type: "number",
        min: -180,
        max: 180,
        required: true,
    },
    {
        name: "payload_weight_kg",
        label: "Payload Weight (kg)",
        type: "number",
        min: 0,
        required: true,
    },
];

export default function OrderForm({
    order, onClose, onSaved, onSavingChange
}){
    const editing = Boolean(order);
    const [form, setForm] = useState(() => ({
        ...initialForm(order),
        delivery_deadline: toLocalDateTime(order?.delivery_deadline),
    }));
    const formId = useId();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function handleChange(event){
        const {name, value} = event.target;
        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    async function handleSubmit(event){
        event.preventDefault();

        if (saving) return;

        setError("");
        setSaving(true);
        onSavingChange?.(true);

        try{
            const payload = {
                customer_name: form.customer_name.trim() || null,
                customer_phone: form.customer_phone.trim() || null,
                pickup_address: form.pickup_address.trim(),
                pickup_latitude: Number(form.pickup_latitude),
                pickup_longitude: Number(form.pickup_longitude),
                delivery_address: form.delivery_address.trim(),
                delivery_latitude: Number(form.delivery_latitude),
                delivery_longitude: Number(form.delivery_longitude),
                payload_weight_kg: Number(form.payload_weight_kg),
                priority: form.priority,
                notes: form.notes.trim() || null,
            };

            const previousDeadline = toLocalDateTime(order?.delivery_deadline);
            if (
                !editing ||
                form.delivery_deadline !== previousDeadline
            ){
                payload.delivery_deadline = form.delivery_deadline ? new Date(form.delivery_deadline).toISOString() : null;
            }

            if (editing){
                await updateOrder(order.id, payload);
            }
            else{
                payload.order_number = form.order_number.trim().toUpperCase();
                await createOrder(payload);
            }

            onSaved(
                editing
                    ? "Order updated successfully."
                    : "Order created successfully."
            );
        }
        catch (requestError){
            setError(getOrderError(requestError));
        }
        finally{
            setSaving(false);
            onSavingChange?.(false);
        }
    }

    return (
        <section className="vord-panel">
            {/* <div className="vord-panel-header">
                <div className="vord-form-heading">
                    <Package size={23} />

                    <div>
                        <h2>
                            {editing ? "Edit Order" : "Create Order"}
                        </h2>

                        <p>
                            Enter the delivery and payload information.
                        </p>
                    </div>
                </div>

                <button
                 type="button"
                 className="vord-icon-button"
                 onClick={onClose}
                 disabled={saving}
                 aria-label="Close order form"
                >
                    <X size={21} />
                </button>
            </div> */}

            {error && (
                <div className="vord-error" role="alert">
                    {error}
                </div>
            )}

            <form id={formId} onSubmit={handleSubmit}>
                <div className="vord-form-grid">
                    {fields.map((field) => (
                        <label
                            key={field.name}
                            className={[
                                "vord-field",
                                field.fullWidth
                                ? "vord-field-full"
                                : ""
                            ].join(" ")}>
                                <span>
                                    {field.label}

                                    {field.required && (
                                        <span className="vord-required"> *</span>
                                    )}
                                </span>

                                <input
                                    name={field.name}
                                    type={field.type || "text"}
                                    value={form[field.name]}
                                    onChange={handleChange}
                                    required={field.required}
                                    min={field.min}
                                    max={field.max}
                                    step={
                                        field.type === "number" ? "any" : undefined
                                    }
                                    disabled={saving || (editing && field.name === "order_number")}
                                    autoComplete="off"
                                    />
                            </label>
                    ))}

                    <label className="vord-field">
                        <span>Delivery Priority</span>  

                        <select
                            name="priority"
                            value={form.priority}
                            onChange={handleChange}
                            disabled={saving}
                        >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </label>

                    <label className="vord-field">
                        <span>Delivery deadline (optional)</span>

                        <input
                            type="datetime-local"
                            name="delivery_deadline"
                            value={form.delivery_deadline}
                            onChange={handleChange}
                            disabled={saving}
                        />
                    </label>

                    <label className="vord-field vord-field-full">
                        <span>Additional notes</span>

                        <textarea
                            name="notes"
                            rows={4}
                            maxLength={1000}
                            value={form.notes}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Special delivery instructions..."
                        />
                    </label>
                </div>

                <GlassModalFooter>

                    <button
                        type="button"
                        className="vord-secondary-button"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        form={formId}
                        className="vord-primary-button"
                        disabled={saving}
                    >
                        <Save size={18} />

                        {saving
                        ? "Saving..."
                        : order
                            ? "Save Changes"
                            : "Create Order"}

                    </button>

                    </GlassModalFooter>
            </form>
        </section>
    );
}