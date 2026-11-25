import { useEffect, useState } from "react";

import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Clock,
  Truck,
  CheckCircle2,
  Pencil,
  Ban,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import {
  getOrders,
  getOrderSummary,
  getOrder,
  cancelOrder,
  getOrderError,
} from "../../../api/tenantOrders";
import GlassModal from "../../../components/common/GlassModal";
import OrderForm from "./OrderForm";
import AnimatedNumber from "../../../components/common/AnimatedNumber";
import "./OrdersPage.css";

const PAGE_SIZE = 20;

const statuses = [
  "pending",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "failed",
  "cancelled",
];

const priorities = [
  "low",
  "normal",
  "high",
  "urgent",
];

function formatLabel(value) {
  if (!value) {
    return "—";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function OrderBadge({ value }) {
  return (
    <span
      className={`vord-badge vord-status-${value}`}
    >
      {formatLabel(value)}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [orderSaving, setOrderSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [busyOrderId, setBusyOrderId] = useState(null);

  function refresh() {
    setRevision((previous) => previous + 1);
  }

  /* Load orders from the backend */

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const params = {
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        };

        if (searchQuery) {
          params.search = searchQuery;
        }

        if (status) {
          params.status = status;
        }

        if (priority) {
          params.priority = priority;
        }

        const [orderData, summaryData] =
          await Promise.all([
            getOrders(params, controller.signal),
            getOrderSummary(controller.signal),
          ]);

        if (!controller.signal.aborted) {
          setOrders(orderData);
          setSummary(summaryData);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(getOrderError(requestError));
          setOrders([]);
          setSummary(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => controller.abort();
  }, [
    page,
    searchQuery,
    status,
    priority,
    revision,
  ]);

  /* Search */

  function handleSearch(event) {
    event.preventDefault();

    setPage(0);
    setSearchQuery(search.trim());
  }

  /* Create order */

  function openCreateForm() {
    setSelectedOrder(null);
    setEditingOrder(null);
    setSuccess("");
    setShowForm(true);
  }

  /* Edit order */

  function openEditForm(order) {
    setSelectedOrder(null);
    setEditingOrder(order);
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    setEditingOrder(null);
    setShowForm(false);
  }

  function handleSaved(message) {
    closeForm();
    setSuccess(message);
    setPage(0);
    refresh();
  }

  /* Retrieve full order details */

  async function handleView(orderId) {
    setBusyOrderId(orderId);
    setError("");

    try {
      const data = await getOrder(orderId);

      setSelectedOrder(data);
      setShowForm(false);
    } catch (requestError) {
      setError(getOrderError(requestError));
    } finally {
      setBusyOrderId(null);
    }
  }

  /* Cancel pending order */

  async function handleCancel(order) {
    const confirmed = window.confirm(
      `Cancel order ${order.order_number}?`
    );

    if (!confirmed) {
      return;
    }

    setBusyOrderId(order.id);
    setError("");
    setSuccess("");

    try {
      const updatedOrder = await cancelOrder(order.id);

      setSelectedOrder((previous) =>
        previous?.id === order.id
          ? updatedOrder
          : previous
      );

      setSuccess(
        `Order ${order.order_number} cancelled successfully.`
      );

      setPage(0);
      refresh();
    } catch (requestError) {
      setError(getOrderError(requestError));
    } finally {
      setBusyOrderId(null);
    }
  }

  const metrics = [
    {
      label: "Total Orders",
      value: summary?.total_orders ?? "—",
      icon: Package,
      color: "green",
    },
    {
      label: "Pending Orders",
      value: summary?.pending ?? "—",
      icon: Clock,
      color: "orange",
    },
    {
      label: "Active Orders",
      value: summary?.active_orders ?? "—",
      icon: Truck,
      color: "blue",
    },
    {
      label: "Delivered Orders",
      value: summary?.delivered ?? "—",
      icon: CheckCircle2,
      color: "green",
    },
  ];

  return (
    <div className="vord-page">

      {/* Page heading */}

      <div className="vord-heading">

        <div>

          <div className="vto-eyebrow">
            Delivery Operations
          </div>

          <h1>Orders</h1>

          <p>
            Create, manage and monitor your delivery orders.
          </p>

        </div>

        <button
          type="button"
          className="vord-primary-button"
          onClick={openCreateForm}
          disabled={showForm}
        >
          <Plus size={19} />
          Create Order
        </button>

      </div>

      {/* Success and error messages */}

      {success && (
        <div className="vord-success" role="status">

          <CheckCircle2 size={19} />

          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="vord-icon-button"
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>

        </div>
      )}

      {error && (
        <div className="vord-error" role="alert">
          {error}
        </div>
      )}

      {/* Summary cards */}

      <div className="vord-metrics">

        {metrics.map((metric) => {
          const MetricIcon = metric.icon;

          return (
            <article
              className="vord-metric-card"
              key={metric.label}
            >

              <div>

                <span>{metric.label}</span>

                <strong>
                  <AnimatedNumber
                    value={metric.value}
                    duration={1400}
                  />
                </strong>

              </div>

              <div
                className={
                  `vord-metric-icon vto-${metric.color}`
                }
              >
                <MetricIcon size={23} />
              </div>

            </article>
          );
        })}

      </div>

      {/* Create and edit form */}

      {showForm && (
        <GlassModal
          title={editingOrder ? "Edit Order" : "Create Order"}
          subtitle="Enter the delivery and payload information"
          size="lg"
          showFooter={false}
          dismissible={!orderSaving}
          onClose={closeForm}>
            {({ requestClose, finish }) => (
              <OrderForm
                key={editingOrder?.id || "new"}
                order={editingOrder}
                onClose={requestClose}
                onSavingChange={setOrderSaving}
                onSaved={(message) => finish(() => handleSaved(message))}
              />
            )}
          </GlassModal>
      )}

      {/* Order details */}

     
      {selectedOrder && (
        <GlassModal
          title="Order Details"
          subtitle="Delivery information and operational status"
          size="lg"
          onClose={() => setSelectedOrder(null)}
        >

          <section className="vord-panel">

            <div className="vord-profile-heading">

              <div className="vord-profile-icon">
                <Package size={28} />
              </div>

              <div>

                <h2>{selectedOrder.order_number}</h2>

                <p>
                  {selectedOrder.customer_name ||
                    "Customer not specified"}
                </p>

                <OrderBadge value={selectedOrder.status} />

              </div>

            </div>


            <h3 className="vord-details-title">
              Delivery Information
            </h3>


            <dl className="vord-details-grid">

              {[
                [
                  "Customer",
                  selectedOrder.customer_name,
                ],
                [
                  "Phone",
                  selectedOrder.customer_phone,
                ],
                [
                  "Pickup Address",
                  selectedOrder.pickup_address,
                ],
                [
                  "Pickup Coordinates",
                  `${selectedOrder.pickup_latitude}, ${selectedOrder.pickup_longitude}`,
                ],
                [
                  "Delivery Address",
                  selectedOrder.delivery_address,
                ],
                [
                  "Delivery Coordinates",
                  `${selectedOrder.delivery_latitude}, ${selectedOrder.delivery_longitude}`,
                ],
                [
                  "Payload",
                  `${selectedOrder.payload_weight_kg} kg`,
                ],
                [
                  "Priority",
                  formatLabel(selectedOrder.priority),
                ],
                [
                  "Delivery Deadline",
                  formatDate(selectedOrder.delivery_deadline),
                ],
                [
                  "Created",
                  formatDate(selectedOrder.created_at),
                ],
                [
                  "Notes",
                  selectedOrder.notes,
                ],
              ].map(([label, value]) => (

                <div key={label}>

                  <dt>{label}</dt>

                  <dd>{value ?? "—"}</dd>

                </div>

              ))}

            </dl>

          </section>

        </GlassModal>
      )}


      {/* Orders table */}

      <section className="vord-panel">

        <div className="vord-panel-header">

          <div>
            <h2>Delivery Orders</h2>
            <p>Manage your company's order records.</p>
          </div>

          <button
            type="button"
            className="vord-secondary-button"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "vord-spinning" : ""}
            />
            Refresh
          </button>

        </div>

        {/* Search and filtering */}

        <div className="vord-toolbar">

          <form
            className="vord-search"
            onSubmit={handleSearch}
          >

            <Search size={19} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              maxLength={255}
              placeholder="Search orders..."
              aria-label="Search orders"
            />

            <button
              type="submit"
              className="vord-secondary-button"
            >
              Search
            </button>

          </form>

          <select
            value={status}
            aria-label="Filter by order status"
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(0);
            }}
          >
            <option value="">All statuses</option>

            {statuses.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}

          </select>

          <select
            value={priority}
            aria-label="Filter by priority"
            onChange={(event) => {
              setPriority(event.target.value);
              setPage(0);
            }}
          >
            <option value="">All priorities</option>

            {priorities.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}

          </select>

          <button
            type="button"
            className="vord-secondary-button"
            onClick={() => {
              setSearch("");
              setSearchQuery("");
              setStatus("");
              setPriority("");
              setPage(0);
            }}
          >
            Clear
          </button>

        </div>

        {/* Loading state */}

        {loading ? (

          <div className="vord-empty">

            <RefreshCw
              size={30}
              className="vord-spinning"
            />

            <h3>Loading orders...</h3>

          </div>

        ) : error && orders.length === 0 ? (

          <div className="vord-empty">
            <Package size={36} />
            <h3>Unable to load orders</h3>

            <button
              type="button"
              className="vord-secondary-button"
              onClick={refresh}
            >
              Try Again
            </button>
          </div>

        ) : orders.length === 0 ? (

          <div className="vord-empty">

            <Package size={40} />

            <h3>No orders found</h3>

            <p>
              Create an order or adjust your search filters.
            </p>

            <button
              type="button"
              className="vord-primary-button"
              onClick={openCreateForm}
              disabled={showForm}
            >
              <Plus size={18} />
              Create Order
            </button>

          </div>

        ) : (

          <div className="vord-table-wrapper">

            <table className="vord-table">

              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Payload</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {orders.map((order) => {

                  const pending =
                    order.status === "pending";

                  const busy =
                    busyOrderId === order.id;

                  return (

                    <tr key={order.id}>

                      <td>
                        <strong>
                          {order.order_number}
                        </strong>
                      </td>

                      <td>
                        {order.customer_name || "—"}
                      </td>

                      <td>{order.pickup_address}</td>

                      <td>{order.delivery_address}</td>

                      <td>
                        {order.payload_weight_kg} kg
                      </td>

                      <td>
                        <OrderBadge
                          value={order.priority}
                        />
                      </td>

                      <td>
                        <OrderBadge
                          value={order.status}
                        />
                      </td>

                      <td>
                        {formatDate(order.created_at)}
                      </td>

                      <td>

                        <div className="vord-table-actions">

                          <button
                            type="button"
                            className="vord-icon-button"
                            title="View order"
                            aria-label={
                              `View ${order.order_number}`
                            }
                            disabled={busyOrderId !== null}
                            onClick={() =>
                              handleView(order.id)
                            }
                          >
                            <Eye size={17} />
                          </button>

                          {pending && (
                            <>
                              <button
                                type="button"
                                className="vord-icon-button"
                                title="Edit order"
                                aria-label={
                                  `Edit ${order.order_number}`
                                }
                                disabled={busy || showForm}
                                onClick={() =>
                                  openEditForm(order)
                                }
                              >
                                <Pencil size={17} />
                              </button>

                              <button
                                type="button"
                                className={
                                  "vord-icon-button vord-danger-button"
                                }
                                title="Cancel order"
                                aria-label={
                                  `Cancel ${order.order_number}`
                                }
                                disabled={
                                  busyOrderId !== null ||
                                  showForm
                                }
                                onClick={() =>
                                  handleCancel(order)
                                }
                              >
                                <Ban size={17} />
                              </button>
                            </>
                          )}

                        </div>

                      </td>

                    </tr>

                  );
                })}

              </tbody>

            </table>

          </div>

        )}

        {/* Pagination */}

        <div className="vord-pagination">

          <span>
            Page {page + 1}
            {" · "}
            {loading ? "Loading..." : `${orders.length} orders`}
          </span>

          <div>

            <button
              type="button"
              className="vord-secondary-button"
              disabled={page === 0 || loading}
              onClick={() =>
                setPage((previous) => previous - 1)
              }
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <button
              type="button"
              className="vord-secondary-button"
              disabled={
                orders.length < PAGE_SIZE ||
                loading
              }
              onClick={() =>
                setPage((previous) => previous + 1)
              }
            >
              Next
              <ChevronRight size={17} />
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}
