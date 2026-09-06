import DealCollaboratorsPanel from "./features/DealCollaboratorsPanel";
import { useEffect, useState } from "react";

type Company = {
  id: number;
  name: string;
  website?: string | null;
  email?: string | null;
  contactPerson?: string | null;
  industry?: string | null;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Deal = {
  id: number;
  title: string;
  description?: string | null;
  requirements?: string | null;
  value?: number | string | null;
  stage: string;
  expectedCloseDate?: string | null;
  companyId: number;
  ownerId: number;
  company?: Company;
  owner?: User;
};

type LoggedInUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("salescrm_token");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

function App() {
  // =========================
  // AUTHENTICATION
  // =========================

  const [loggedInUser, setLoggedInUser] =
    useState<LoggedInUser | null>(() => {
      const savedUser = localStorage.getItem("salescrm_user");

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setLoginError("");

    if (!loginEmail || !loginPassword) {
      setLoginError(
        "Please enter email and password."
      );
      return;
    }

    try {
      setLoginLoading(true);

      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoginError(
          data.message || "Login failed"
        );
        return;
      }

      localStorage.setItem(
        "salescrm_user",
        JSON.stringify(data.user)
      );
      localStorage.setItem(
        "salescrm_token",
        data.token
      );

      setLoggedInUser(data.user);

      setLoginEmail("");
      setLoginPassword("");
    } catch (error) {
      console.error(error);

      setLoginError(
        "Could not connect to the server."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("salescrm_user");
    localStorage.removeItem("salescrm_token");
    setLoggedInUser(null);
  };

  // =========================
  // CRM STATE
  // =========================

  const [page, setPage] = useState<
    "dashboard" | "companies" | "deals" | "users"
  >("dashboard");

  const [companies, setCompanies] =
    useState<Company[]>([]);
  const [archivedCompanies, setArchivedCompanies] = 
    useState<Company[]>([]);
  
  const [companySearch, setCompanySearch] = 
    useState("");
  const [companySortBy, setCompanySortBy] = useState("name");
  const [companySortOrder, setCompanySortOrder] = useState("asc");
  const [companyPage, setCompanyPage] = useState(1);
  const [companyLimit] = useState(5);
  const [companyTotal, setCompanyTotal] = useState(0);
  const [companyTotalPages, setCompanyTotalPages] = useState(0);

  const [users, setUsers] =
    useState<User[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("SALES");

  const [deals, setDeals] =
    useState<Deal[]>([]);
  const [allDeals, setAllDeals] =
    useState<Deal[]>([]);
  const [allCompanies, setAllCompanies] =
    useState<Company[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");
  

  const [dealSearch, setDealSearch] = useState("");
  const [dealStageFilter, setDealStageFilter] = useState("");
  const [dealCompanyFilter, setDealCompanyFilter] = useState("");
  const [dealOwnerFilter, setDealOwnerFilter] = useState("");
  const [dealSortBy, setDealSortBy] = useState("createdAt");
  const [dealSortOrder, setDealSortOrder] = useState("desc");
  const [dealPage, setDealPage] = useState(1);
  const [dealLimit] = useState(10);
  const [dealTotal, setDealTotal] = useState(0);
  const [dealTotalPages, setDealTotalPages] = useState(0);

  const [companyForm, setCompanyForm] =
    useState({
      name: "",
      website: "",
      email: "",
      contactPerson: "",
      industry: "",
    });
  const [stageChangeReason, setStageChangeReason] = useState("");
  const [dealForm, setDealForm] =
    useState({
      title: "",
      description: "",
      requirements: "",
      value: "",
      stage: "NEW",
      expectedCloseDate: "",
      companyId: "",
      ownerId: "",
    });

  const [editingCompanyId, setEditingCompanyId] =
    useState<number | null>(null);

  const [editingDealId, setEditingDealId] =
    useState<number | null>(null);

  // =========================
  // FETCH DATA
  // =========================

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_URL}/companies?page=${companyPage}&limit=${companyLimit}&sortBy=${companySortBy}&order=${companySortOrder}`, {
      headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          "Failed to fetch companies"
        );
      }

      
      setCompanies(data.companies);
      setCompanyTotal(data.total);
      setCompanyTotalPages(data.totalPages);
    } catch (error) {
      console.error(error);
      setError("Could not load companies");
    }
  };
  const fetchArchivedCompanies = async () => {
  try {
    const response = await fetch(
      `${API_URL}/companies/archived`,
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch archived companies"
      );
    }

    setArchivedCompanies(data);
  } catch (error) {
    console.error("Fetch archived companies error:", error);

    setError(
      error instanceof Error
        ? error.message
        : "Could not fetch archived companies"
    );
  }
};

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${API_URL}/users`, {
        headers: getAuthHeaders(),}
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch users"
        );
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      setError("Could not load users");
    }
  };

  const fetchAllCompanies = async () => {
    try {
      const response = await fetch(`${API_URL}/companies?all=true`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok && data.companies) {
        setAllCompanies(data.companies);
      }
    } catch (err) {
      console.error("Failed to load all companies", err);
    }
  };

  const fetchAllDeals = async () => {
    try {
      const response = await fetch(`${API_URL}/deals?all=true`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok && data.deals) {
        setAllDeals(data.deals);
      }
    } catch (err) {
      console.error("Failed to load all deals", err);
    }
  };

  const fetchDeals = async (pageOverride?: number) => {
    try {
      setLoading(true);
      const currentPage =
        pageOverride !== undefined ? pageOverride : dealPage;
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(dealLimit),
        sortBy: dealSortBy,
        order: dealSortOrder,
      });

      if (dealSearch.trim()) {
        params.append("search", dealSearch.trim());
      }
      if (dealStageFilter) {
        params.append("stage", dealStageFilter);
      }
      if (dealCompanyFilter) {
        params.append("companyId", dealCompanyFilter);
      }
      if (dealOwnerFilter) {
        params.append("ownerId", dealOwnerFilter);
      }

      const response = await fetch(`${API_URL}/deals?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch deals");
      }

      const data = await response.json();
      setDeals(data.deals || []);
      setDealTotal(data.total || 0);
      setDealTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error(error);
      setError("Could not load deals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loggedInUser) {
      return;
    }

    fetchCompanies();
    fetchAllCompanies();
    fetchUsers();
    fetchDeals(1);
    fetchAllDeals();
  }, [loggedInUser]);

  useEffect(() => {
    if (!loggedInUser) {
      return;
    }

    fetchDeals();
  }, [
    dealPage,
    dealSortBy,
    dealSortOrder,
    dealStageFilter,
    dealCompanyFilter,
    dealOwnerFilter,
  ]);

  const filteredCompanies = companies;
  const filteredDeals = deals;

  // =========================
  // COMPANY FUNCTIONS
  // =========================

  const handleCompanyChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCompanyForm({
      ...companyForm,
      [event.target.name]:
        event.target.value,
    });
  };

  const handleCompanySubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!companyForm.name.trim()) {
      setError(
        "Company name is required"
      );
      return;
    }

    try {
      const url = editingCompanyId
        ? `${API_URL}/companies/${editingCompanyId}`
        : `${API_URL}/companies`;

      const method = editingCompanyId
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(
          companyForm
        ),
      });

      if (!response.ok) {
        throw new Error(
          "Failed to save company"
        );
      }

      resetCompanyForm();
      await fetchCompanies();
    } catch (error) {
      console.error(error);
      setError(
        "Could not save company"
      );
    }
  };

  const handleEditCompany = (
    company: Company
  ) => {
    setEditingCompanyId(company.id);

    setCompanyForm({
      name: company.name,
      website: company.website || "",
      email: company.email || "",
      contactPerson:
        company.contactPerson || "",
      industry:
        company.industry || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteCompany = async (
    id: number
  ) => {
    if (
      !window.confirm(
        "Delete this company?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/companies/${id}`,
        {
          method: "DELETE",
          headers: {
          ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete company"
        );
      }

      await fetchCompanies();
      await fetchDeals();
    } catch (error) {
      console.error(error);
      setError(
        "Could not delete company"
      );
    }
  };

  const resetCompanyForm = () => {
    setEditingCompanyId(null);

    setCompanyForm({
      name: "",
      website: "",
      email: "",
      contactPerson: "",
      industry: "",
    });

    setError("");
  };

  // =========================
  // DEAL FUNCTIONS
  // =========================

  const DEAL_STAGES = [
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

const getAllowedNextStages = (currentStage: string) => {
  switch (currentStage) {
    case "NEW":
      return ["QUALIFIED"];

    case "QUALIFIED":
      return ["NEW", "PROPOSAL"];

    case "PROPOSAL":
      return ["QUALIFIED", "NEGOTIATION"];

    case "NEGOTIATION":
      return ["PROPOSAL", "WON", "LOST"];

    default:
      return [];
  }
};

  const handleDealChange = (
    event: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) => {
    setDealForm({
      ...dealForm,
      [event.target.name]:
        event.target.value,
    });
  };

  const handleDealSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!dealForm.title.trim()) {
      setError(
        "Deal title is required"
      );
      return;
    }

    if (!dealForm.companyId) {
      setError(
        "Please select a company"
      );
      return;
    }

    if (!dealForm.ownerId) {
      setError(
        "Please select a deal owner"
      );
      return;
    }

    try {
      const url = editingDealId
        ? `${API_URL}/deals/${editingDealId}`
        : `${API_URL}/deals`;

      const method = editingDealId
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
             ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...dealForm,
          stageChangeReason,
          value: dealForm.value
            ? Number(dealForm.value)
            : null,
          companyId: Number(
            dealForm.companyId
          ),
          ownerId: Number(
            dealForm.ownerId
          ),
          expectedCloseDate:
            dealForm.expectedCloseDate ||
            null,
        }),
      });

      if (!response.ok) {
        throw new Error(
          "Failed to save deal"
        );
      }

      resetDealForm();
      await fetchDeals();
      await fetchAllDeals();
    } catch (error) {
      console.error(error);
      setError(
        "Could not save deal"
      );
    }
  };

  const handleEditDeal = (
    deal: Deal
  ) => {
    setEditingDealId(deal.id);

    setDealForm({
      title: deal.title,
      description:
        deal.description || "",
      requirements:
        deal.requirements || "",
      value:
        deal.value?.toString() || "",
      stage: deal.stage,
      expectedCloseDate:
        deal.expectedCloseDate
          ? deal.expectedCloseDate.substring(
              0,
              10
            )
          : "",
      companyId:
        deal.companyId.toString(),
      ownerId:
        deal.ownerId.toString(),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteDeal = async (
    id: number
  ) => {
    if (
      !window.confirm(
        "Delete this deal?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/deals/${id}`,
        {
          method: "DELETE",
          headers: {
          ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete deal"
        );
      }

      await fetchDeals();
      await fetchAllDeals();
    } catch (error) {
      console.error(error);
      setError(
        "Could not delete deal"
      );
    }
  };

  const resetDealForm = () => {
    setEditingDealId(null);
    setStageChangeReason("");

    setDealForm({
      title: "",
      description: "",
      requirements: "",
      value: "",
      stage: "NEW",
      expectedCloseDate: "",
      companyId: "",
      ownerId: "",
    });

    setError("");
  };

  // =========================
  // LOGIN PAGE
  // =========================

  if (!loggedInUser) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h1>Sales CRM</h1>
            <p>
              Sign in to manage your
              sales pipeline
            </p>
          </div>

          {loginError && (
            <div className="login-error">
              {loginError}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="login-form"
          >
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={loginEmail}
              onChange={(event) =>
                setLoginEmail(
                  event.target.value
                )
              }
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={loginPassword}
              onChange={(event) =>
                setLoginPassword(
                  event.target.value
                )
              }
              required
            />

            <button
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading
                ? "Signing in..."
                : "Login"}
            </button>
          </form>

          <div className="login-footer">
            Sales CRM Management System
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD DATA
  // =========================

  const dashboardDeals = allDeals.length > 0 ? allDeals : deals;
  const totalDealValue =
    dashboardDeals.reduce(
      (total, deal) =>
        total +
        Number(deal.value || 0),
      0
    );

  // =========================
  // MAIN CRM
  // =========================

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Sales CRM</h1>
          <p>
            Manage your sales pipeline
          </p>
        </div>

        <div className="user-area">
          <span>
            {loggedInUser.name}
          </span>

          <small>
            {loggedInUser.role}
          </small>

          <button
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <button
            className={
              page === "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("dashboard")
            }
          >
            Dashboard
          </button>

          <button
            className={
              page === "companies"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("companies")
            }
          >
            Companies
          </button>

          <button
            className={
              page === "deals"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("deals")
            }
          >
            Deals
          </button>
            {loggedInUser.role === "ADMIN" && (
            <button
              className={
                page === "users"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("users")
              }
            >
              Users
            </button>)
            }
        </aside>

        <main className="content">
          {error && (
            <div className="error">
              <span>{error}</span>

              <button
                onClick={() =>
                  setError("")
                }
              >
                ×
              </button>
            </div>
          )}

          {/* DASHBOARD */}

          
{page === "dashboard" && (
  <>
    <h2>Sales Dashboard</h2>

    {/* SUMMARY CARDS */}

    <div className="cards">
      <div className="card">
        <span>Total Companies</span>
        <strong>
          {allCompanies.length > 0
            ? allCompanies.length
            : companyTotal || companies.length}
        </strong>
      </div>

      <div className="card">
        <span>Total Deals</span>
        <strong>{dashboardDeals.length}</strong>
      </div>

      <div className="card">
        <span>Pipeline Value</span>
        <strong>₹{totalDealValue.toLocaleString()}</strong>
      </div>

      <div className="card">
        <span>Won Deals</span>
        <strong>
          {
            dashboardDeals.filter(
              (deal) => deal.stage === "WON"
            ).length
          }
        </strong>
      </div>
    </div>

    {/* SALES PIPELINE */}

    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>Sales Pipeline</h3>
          <p className="panel-subtitle">
            Track deals through the sales process
          </p>
        </div>
      </div>

      <div className="pipeline">
        {[
          "NEW",
          "QUALIFIED",
          "PROPOSAL",
          "NEGOTIATION",
          "WON",
        ].map((stage) => {
          const stageDeals = dashboardDeals.filter(
            (deal) => deal.stage === stage
          );

          const stageValue = stageDeals.reduce(
            (total, deal) =>
              total + Number(deal.value || 0),
            0
          );

          return (
            <div
              className="pipeline-column"
              key={stage}
            >
              <div className="pipeline-header">
                <div>
                  <h4>{stage}</h4>

                  <span>
                    {stageDeals.length} deal
                    {stageDeals.length !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>

                <strong>
                  ₹{stageValue.toLocaleString()}
                </strong>
              </div>

              <div className="pipeline-deals">
                {stageDeals.length === 0 ? (
                  <div className="empty-stage">
                    No deals
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <div
                      className="pipeline-deal"
                      key={deal.id}
                    >
                      <strong>
                        {deal.title}
                      </strong>

                      <span>
                        {deal.company?.name ||
                          "No company"}
                      </span>

                      <span>
                        Owner:{" "}
                        {deal.owner?.name ||
                          "Unknown"}
                      </span>

                      <b>
                        ₹{Number(
                          deal.value || 0
                        ).toLocaleString()}
                      </b>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* LOST DEALS */}

        <div className="pipeline-column lost-column">
          <div className="pipeline-header">
            <div>
              <h4>LOST</h4>

              <span>
                {
                  dashboardDeals.filter(
                    (deal) =>
                      deal.stage === "LOST"
                  ).length
                }{" "}
                deals
              </span>
            </div>

            <strong>
              ₹
              {dashboardDeals
                .filter(
                  (deal) =>
                    deal.stage === "LOST"
                )
                .reduce(
                  (total, deal) =>
                    total +
                    Number(
                      deal.value || 0
                    ),
                  0
                )
                .toLocaleString()}
            </strong>
          </div>

          <div className="pipeline-deals">
            {dashboardDeals
              .filter(
                (deal) =>
                  deal.stage === "LOST"
              )
              .map((deal) => (
                <div
                  className="pipeline-deal"
                  key={deal.id}
                >
                  <strong>
                    {deal.title}
                  </strong>

                  <span>
                    {deal.company?.name ||
                      "No company"}
                  </span>

                  <b>
                    ₹
                    {Number(
                      deal.value || 0
                    ).toLocaleString()}
                  </b>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>

    {/* RECENT DEALS */}

    <div className="panel">
      <h3>Recent Deals</h3>

      {dashboardDeals.length === 0 ? (
        <p>No deals available.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Deal</th>
              <th>Company</th>
              <th>Owner</th>
              <th>Value</th>
              <th>Stage</th>
            </tr>
          </thead>

          <tbody>
            {dashboardDeals.slice(0, 10).map((deal) => (
              <tr key={deal.id}>
                <td>{deal.title}</td>

                <td>
                  {deal.company?.name || "-"}
                </td>

                <td>
                  {deal.owner?.name || "-"}
                </td>

                <td>
                  ₹
                  {Number(
                    deal.value || 0
                  ).toLocaleString()}
                </td>

                <td>
                  <span className="stage-badge">
                    {deal.stage}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </>
)}



          {/* COMPANIES */}

          {page === "companies" && (
            <>
              <h2>
                {editingCompanyId
                  ? "Edit Company"
                  : "Add Company"}
              </h2>

              <form
                className="form"
                onSubmit={
                  handleCompanySubmit
                }
              >
                <input
                  name="name"
                  placeholder="Company Name *"
                  value={
                    companyForm.name
                  }
                  onChange={
                    handleCompanyChange
                  }
                  required
                />

                <input
                  name="website"
                  placeholder="Website"
                  value={
                    companyForm.website
                  }
                  onChange={
                    handleCompanyChange
                  }
                />

                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={
                    companyForm.email
                  }
                  onChange={
                    handleCompanyChange
                  }
                />

                <input
                  name="contactPerson"
                  placeholder="Contact Person"
                  value={
                    companyForm.contactPerson
                  }
                  onChange={
                    handleCompanyChange
                  }
                />

                <input
                  name="industry"
                  placeholder="Industry"
                  value={
                    companyForm.industry
                  }
                  onChange={
                    handleCompanyChange
                  }
                />

                <div>
                  <button type="submit">
                    {editingCompanyId
                      ? "Update Company"
                      : "Add Company"}
                  </button>

                  {editingCompanyId && (
                    <button
                      type="button"
                      onClick={
                        resetCompanyForm
                      }
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="panel">
                <h2>
                  Companies
                </h2>
                <div style={{ marginBottom: "15px" }}>
  <input
    type="text"
    placeholder="Search companies..."
    value={companySearch}
    onChange={(e) => setCompanySearch(e.target.value)}
  />

  <button
    onClick={async () => {
      try {
        const response = await fetch(
          `${API_URL}/companies?search=${encodeURIComponent(companySearch)
          }&sortBy=${companySortBy}&order=${companySortOrder}&page=${companyPage}&limit=${companyLimit}`,
          {
            headers: {
              ...getAuthHeaders(),
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to search companies"
          );
        }

        setCompanies(data.companies);
        setCompanyTotal(data.total);
        setCompanyTotalPages(data.totalPages);
      } catch (error) {
        console.error("Company search error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Could not search companies"
        );
      }
    }}
  >
    Search
  </button>

  <button
    onClick={() => {
      setCompanySearch("");
      fetchCompanies();
    }}
    style={{ marginLeft: "10px" }}
  >
    Clear
  </button>
  <select
  value={companySortBy}
  onChange={(e) => setCompanySortBy(e.target.value)}
  style={{ marginLeft: "10px" }}
>
  <option value="name">Name</option>
  <option value="createdAt">Created Date</option>
</select>

<select
  value={companySortOrder}
  onChange={(e) => setCompanySortOrder(e.target.value)}
  style={{ marginLeft: "10px" }}
>
  <option value="asc">Ascending</option>
  <option value="desc">Descending</option>
</select>
</div>
  {(loggedInUser.role === "ADMIN" ||
  loggedInUser.role === "MANAGER") && (
  <>
    <button onClick={fetchArchivedCompanies}>
      Show Archived Companies
    </button>

    {archivedCompanies.length > 0 && (
      <div style={{ marginTop: "20px" }}>
        <h3>Archived Companies</h3>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Website</th>
              <th>Email</th>
              <th>Contact Person</th>
              <th>Industry</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {archivedCompanies.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.website || "-"}</td>
                <td>{company.email || "-"}</td>
                <td>{company.contactPerson || "-"}</td>
                <td>{company.industry || "-"}</td>

                <td>
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Restore this company?"
                        )
                      ) {
                        return;
                      }

                      try {
                        const response = await fetch(
                          `${API_URL}/companies/${company.id}/restore`,
                          {
                            method: "POST",
                            headers: {
                              ...getAuthHeaders(),
                            },
                          }
                        );

                        const data = await response.json();

                        if (!response.ok) {
                          throw new Error(
                            data.message ||
                              "Failed to restore company"
                          );
                        }

                        await fetchCompanies();
                        await fetchArchivedCompanies();
                      } catch (error) {
                        console.error(
                          "Restore company error:",
                          error
                        );

                        setError(
                          error instanceof Error
                            ? error.message
                            : "Could not restore company"
                        );
                      }
                    }}
                  >
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </>
)}
                <div className="filter-bar">
  <input
    type="text"
    placeholder="Search companies..."
    value={companySearch}
    onChange={(event) =>
      setCompanySearch(event.target.value)
    }
  />

  <span>
    Showing {filteredCompanies.length} of{" "}
    {companies.length}
  </span>
</div>

                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>
                        Company
                      </th>
                      <th>
                        Industry
                      </th>
                      <th>
                        Contact
                      </th>
                      <th>
                        Email
                      </th>
                      <th>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCompanies.map(
                      (company) => (
                        <tr
                          key={
                            company.id
                          }
                        >
                          <td>
                            {company.id}
                          </td>

                          <td>
                            {company.name}
                          </td>

                          <td>
                            {company.industry ||
                              "-"}
                          </td>

                          <td>
                            {company.contactPerson ||
                              "-"}
                          </td>

                          <td>
                            {company.email ||
                              "-"}
                          </td>

                          <td>
  <button
    onClick={() =>
      handleEditCompany(company)
    }
  >
    Edit
  </button>

  <button
    onClick={() =>
      handleDeleteCompany(company.id)
    }
  >
    Delete
  </button>
  {(loggedInUser.role === "ADMIN" ||
  loggedInUser.role === "MANAGER") && (
  <button
    onClick={async () => {
      if (!window.confirm("Archive this company?")) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/companies/${company.id}/archive`,
          {
            method: "POST",
            headers: {
              ...getAuthHeaders(),
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to archive company"
          );
        }

        await fetchCompanies();
      } catch (error) {
        console.error("Archive company error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Could not archive company"
        );
      }
    }}
  >
    Archive
  </button>
)}
</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
                <div style={{ marginTop: "15px" }}>
  <button
    disabled={companyPage <= 1}
    onClick={() => {
      setCompanyPage((prev) => prev - 1);
    }}
  >
    Previous
  </button>

  <span style={{ margin: "0 15px" }}>
    Page {companyPage} of {companyTotalPages || 1}
  </span>

  <button
    disabled={
      companyPage >= companyTotalPages ||
      companyTotalPages === 0
    }
    onClick={() => {
      setCompanyPage((prev) => prev + 1);
    }}
  >
    Next
  </button>

  <span style={{ marginLeft: "15px" }}>
    Total: {companyTotal}
  </span>
</div>
              </div>
            </>
          )}

          {/* DEALS */}

          {page === "deals" && (
            <>
              <h2>
                {editingDealId
                  ? "Edit Deal"
                  : "Create Deal"}
              </h2>

              <form
                className="form"
                onSubmit={
                  handleDealSubmit
                }
              >
                <input
                  name="title"
                  placeholder="Deal Title *"
                  value={
                    dealForm.title
                  }
                  onChange={
                    handleDealChange
                  }
                  required
                />

                <input
                  name="value"
                  type="number"
                  placeholder="Deal Value"
                  value={
                    dealForm.value
                  }
                  onChange={
                    handleDealChange
                  }
                />

                <select
  name="stage"
  value={dealForm.stage}
  onChange={(event) => {
    const newStage = event.target.value;

    if (editingDealId) {
      const currentIndex =
        DEAL_STAGES.indexOf(dealForm.stage);

      const newIndex =
        DEAL_STAGES.indexOf(newStage);

      if (newIndex < currentIndex) {
        const reason = window.prompt(
          "Reason for moving the deal backward:"
        );

        if (!reason || !reason.trim()) {
          return;
        }

        setStageChangeReason(reason.trim());
      } else {
        setStageChangeReason("");
      }
    }

    setDealForm({
      ...dealForm,
      stage: newStage,
    });
  }}
  required
>
  {editingDealId ? (
    <>
      <option value={dealForm.stage}>
        {dealForm.stage}
      </option>

      {getAllowedNextStages(dealForm.stage)
        .filter(
          (stage) => stage !== dealForm.stage
        )
        .map((stage) => (
          <option
            key={stage}
            value={stage}
          >
            {stage}
          </option>
        ))}
    </>
  ) : (
    <option value="NEW">NEW</option>
  )}
</select>

                <select
                  name="companyId"
                  value={
                    dealForm.companyId
                  }
                  onChange={
                    handleDealChange
                  }
                  required
                >
                  <option value="">
                    Select Company *
                  </option>

                  {(allCompanies.length > 0
                    ? allCompanies
                    : companies
                  ).map((company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  ))}
                </select>

                <select
                  name="ownerId"
                  value={
                    dealForm.ownerId
                  }
                  onChange={
                    handleDealChange
                  }
                  required
                >
                  <option value="">
                    Select Deal Owner *
                  </option>

                  {users.map(
                    (user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.name}
                      </option>
                    )
                  )}
                </select>

                <input
                  name="expectedCloseDate"
                  type="date"
                  value={
                    dealForm.expectedCloseDate
                  }
                  onChange={
                    handleDealChange
                  }
                />

                <textarea
                  name="description"
                  placeholder="Description"
                  value={
                    dealForm.description
                  }
                  onChange={
                    handleDealChange
                  }
                />

                <textarea
                  name="requirements"
                  placeholder="Requirements"
                  value={dealForm.requirements}
                  onChange={handleDealChange}
                />

                {editingDealId && (
                  <DealCollaboratorsPanel
                    dealId={editingDealId}
                    ownerId={Number(dealForm.ownerId)}
                    apiUrl={API_URL}
                    token={localStorage.getItem("salescrm_token") || ""}
                    currentUserId={loggedInUser?.id ?? 0}
                    currentUserRole={loggedInUser?.role ?? ""}
                  />
                )}

                  <div>
                    <button type="submit">
                    {editingDealId
                      ? "Update Deal"
                      : "Create Deal"}
                  </button>

                  {editingDealId && (
                    <button
                      type="button"
                      onClick={
                        resetDealForm
                      }
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="panel">
                <h2>Deals</h2>
                <div className="filter-bar deal-filters">
  <input
    type="text"
    placeholder="Search deals..."
    value={dealSearch}
    onChange={(event) =>
      setDealSearch(event.target.value)
    }
    onKeyDown={(event) => {
      if (event.key === "Enter") {
        setDealPage(1);
        fetchDeals(1);
      }
    }}
  />

  <button
    type="button"
    onClick={() => {
      setDealPage(1);
      fetchDeals(1);
    }}
  >
    Search
  </button>

  <select
    value={dealStageFilter}
    onChange={(event) => {
      setDealStageFilter(event.target.value);
      setDealPage(1);
    }}
  >
    <option value="">All Stages</option>
    <option value="NEW">NEW</option>
    <option value="QUALIFIED">Qualified</option>
    <option value="PROPOSAL">Proposal</option>
    <option value="NEGOTIATION">Negotiation</option>
    <option value="WON">Won</option>
    <option value="LOST">Lost</option>
  </select>

  <select
    value={dealCompanyFilter}
    onChange={(event) => {
      setDealCompanyFilter(event.target.value);
      setDealPage(1);
    }}
  >
    <option value="">All Companies</option>

    {(allCompanies.length > 0
      ? allCompanies
      : companies
    ).map((company) => (
      <option
        key={company.id}
        value={company.id}
      >
        {company.name}
      </option>
    ))}
  </select>

  <select
    value={dealOwnerFilter}
    onChange={(event) => {
      setDealOwnerFilter(event.target.value);
      setDealPage(1);
    }}
  >
    <option value="">All Owners</option>

    {users.map((user) => (
      <option
        key={user.id}
        value={user.id}
      >
        {user.name}
      </option>
    ))}
  </select>

  <select
    value={dealSortBy}
    onChange={(event) => {
      setDealSortBy(event.target.value);
      setDealPage(1);
    }}
  >
    <option value="createdAt">Created Date</option>
    <option value="value">Value</option>
    <option value="title">Title</option>
    <option value="expectedCloseDate">Close Date</option>
    <option value="stage">Stage</option>
  </select>

  <select
    value={dealSortOrder}
    onChange={(event) => {
      setDealSortOrder(event.target.value);
      setDealPage(1);
    }}
  >
    <option value="desc">Descending</option>
    <option value="asc">Ascending</option>
  </select>

  <button
    type="button"
    onClick={() => {
      setDealSearch("");
      setDealStageFilter("");
      setDealCompanyFilter("");
      setDealOwnerFilter("");
      setDealSortBy("createdAt");
      setDealSortOrder("desc");
      setDealPage(1);
    }}
  >
    Clear Filters
  </button>
</div>

<p className="filter-result">
  Showing {deals.length} of {dealTotal} deals
</p>

                {loading ? (
                  <p>
                    Loading deals...
                  </p>
                ) : deals.length ===
                  0 ? (
                  <p>
                    No deals found.
                  </p>
                ) : (
                  <>
                    <table>
                    <thead>
                      <tr>
                        <th>
                          Title
                        </th>
                        <th>
                          Company
                        </th>
                        <th>
                          Owner
                        </th>
                        <th>
                          Value
                        </th>
                        <th>
                          Stage
                        </th>
                        <th>
                          Close Date
                        </th>
                        <th>
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredDeals.map(
                        (deal) => (
                          <tr
                            key={
                              deal.id
                            }
                          >
                            <td>
                              {deal.title}
                            </td>

                            <td>
                              {deal
                                .company
                                ?.name ||
                                "-"}
                            </td>

                            <td>
                              {deal
                                .owner
                                ?.name ||
                                "-"}
                            </td>

                            <td>
                              ₹
                              {Number(
                                deal.value ||
                                  0
                              ).toLocaleString()}
                            </td>

                            <td>
                              {deal.stage}
                            </td>

                            <td>
                              {deal.expectedCloseDate
                                ? new Date(
                                    deal.expectedCloseDate
                                  ).toLocaleDateString()
                                : "-"}
                            </td>

                            <td>
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditDeal(
                                    deal
                                  )
                                }
                                disabled={
                                deal.stage === "WON" ||
                                deal.stage === "LOST"}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteDeal(
                                    deal.id
                                  )
                                }
                              >
                                Delete
                              </button>
                              
                               {/* Reopen HERE */}
                                {loggedInUser.role === "MANAGER" &&
                                  (deal.stage === "WON" || deal.stage === "LOST") && (
                                    <button
                                      onClick={async () => {
                                        if (!window.confirm("Reopen this deal?")) {
                                          return;
                                            }

                                        try {
                                          const response = await fetch(
                                            `${API_URL}/deals/${deal.id}/reopen`,
                                                {
                                                    method: "POST",
                                                    headers: {
                                                    ...getAuthHeaders(),
                                                    },
                                                }
                                              );

                                              const data = await response.json(); 

                                              if (!response.ok) {
                                                throw new Error(
                                                data.message || "Failed to reopen deal"
                                                );
                                              }

                                              await fetchDeals();
                                              await fetchAllDeals();
                                          } catch (error) {
                                            console.error("Reopen error:", error);

                                            setError(
                                              error instanceof Error
                                                  ? error.message
                                                  : "Could not reopen deal"
                                              );
                                            }
                                          }}
                                        >
                                        Reopen
                                      </button>
                                            )}
                                  </td>
                                </tr>
                              )
                            )}
                    </tbody>
                  </table>

                  <div style={{ marginTop: "15px" }}>
                    <button
                      disabled={dealPage <= 1}
                      onClick={() => {
                        setDealPage((prev) => prev - 1);
                      }}
                    >
                      Previous
                    </button>

                    <span style={{ margin: "0 15px" }}>
                      Page {dealPage} of {dealTotalPages || 1}
                    </span>

                    <button
                      disabled={
                        dealPage >= dealTotalPages ||
                        dealTotalPages === 0
                      }
                      onClick={() => {
                        setDealPage((prev) => prev + 1);
                      }}
                    >
                      Next
                    </button>

                    <span style={{ marginLeft: "15px" }}>
                      Total: {dealTotal}
                    </span>
                  </div>
                  </>
                )}
              </div>
            </>
          )}
          
          {/* USERS */}

          {page === "users" &&
            loggedInUser.role === "ADMIN" && (
              <>
                <h2>User Management</h2>

                <div className="panel">
                  <h3>Create User</h3>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();

                    try {
                      const response = await fetch(`${API_URL}/users`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...getAuthHeaders(),
                        },
                        body: JSON.stringify({
                          name: userName,
                          email: userEmail,
                          password: userPassword,
                          role: userRole,
                        }),
                      });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Failed to create user");
                    }

                    alert("User created successfully");

                    setUserName("");
                    setUserEmail("");
                    setUserPassword("");
                    setUserRole("SALES");

                    fetchUsers();
                  } catch (error) {
                    console.error(error);
                    alert(
                      error instanceof Error
                        ? error.message
                        : "Failed to create user"
                    );
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                />

                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                >
                  <option value="SALES">SALES</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>

                <button type="submit">
                    Create User
                </button>
              </form>
          </div>

          <div className="panel">
              <h3>Users</h3>

              {users.length === 0 ? (
               <p>No users found.</p>
             ) : (
              <table>
                <thead>
                  <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                    </tr>
                  ))}
                </tbody>
            </table>
          )}
        </div>
      </>
     )}
          
    </main>
      </div>
    </div>
  );
}

export default App;