
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

const API_URL = "http://localhost:5000/api";

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
    setLoggedInUser(null);
  };

  // =========================
  // CRM STATE
  // =========================

  const [page, setPage] = useState<
    "dashboard" | "companies" | "deals"
  >("dashboard");

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [users, setUsers] =
    useState<User[]>([]);

  const [deals, setDeals] =
    useState<Deal[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [companySearch, setCompanySearch] = useState("");

  const [dealSearch, setDealSearch] = useState("");
  const [dealStageFilter, setDealStageFilter] = useState("");
  const [dealCompanyFilter, setDealCompanyFilter] = useState("");
  const [dealOwnerFilter, setDealOwnerFilter] = useState("");

  const [companyForm, setCompanyForm] =
    useState({
      name: "",
      website: "",
      email: "",
      contactPerson: "",
      industry: "",
    });

  const [dealForm, setDealForm] =
    useState({
      title: "",
      description: "",
      requirements: "",
      value: "",
      stage: "LEAD",
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
      const response = await fetch(
        `${API_URL}/companies`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch companies"
        );
      }

      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error(error);
      setError("Could not load companies");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${API_URL}/users`
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

  const fetchDeals = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/deals`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch deals"
        );
      }

      const data = await response.json();
      setDeals(data);
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
    fetchUsers();
    fetchDeals();
  }, [loggedInUser]);
  const filteredCompanies = companies.filter((company) => {
  const search = companySearch.toLowerCase().trim();

  if (!search) {
    return true;
  }

  return (
    company.name.toLowerCase().includes(search) ||
    (company.industry || "")
      .toLowerCase()
      .includes(search) ||
    (company.contactPerson || "")
      .toLowerCase()
      .includes(search) ||
    (company.email || "")
      .toLowerCase()
      .includes(search)
  );
});
const filteredDeals = deals.filter((deal) => {
  const search = dealSearch.toLowerCase().trim();

  const matchesSearch =
    !search ||
    deal.title.toLowerCase().includes(search) ||
    (deal.description || "")
      .toLowerCase()
      .includes(search) ||
    (deal.company?.name || "")
      .toLowerCase()
      .includes(search) ||
    (deal.owner?.name || "")
      .toLowerCase()
      .includes(search);

  const matchesStage =
    !dealStageFilter ||
    deal.stage === dealStageFilter;

  const matchesCompany =
    !dealCompanyFilter ||
    deal.companyId.toString() ===
      dealCompanyFilter;

  const matchesOwner =
    !dealOwnerFilter ||
    deal.ownerId.toString() ===
      dealOwnerFilter;

  return (
    matchesSearch &&
    matchesStage &&
    matchesCompany &&
    matchesOwner
  );
});

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
        },
        body: JSON.stringify({
          ...dealForm,
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
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete deal"
        );
      }

      await fetchDeals();
    } catch (error) {
      console.error(error);
      setError(
        "Could not delete deal"
      );
    }
  };

  const resetDealForm = () => {
    setEditingDealId(null);

    setDealForm({
      title: "",
      description: "",
      requirements: "",
      value: "",
      stage: "LEAD",
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

  const totalDealValue =
    deals.reduce(
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
        <strong>{companies.length}</strong>
      </div>

      <div className="card">
        <span>Total Deals</span>
        <strong>{deals.length}</strong>
      </div>

      <div className="card">
        <span>Pipeline Value</span>
        <strong>
          ₹
          {deals
            .reduce(
              (total, deal) =>
                total + Number(deal.value || 0),
              0
            )
            .toLocaleString()}
        </strong>
      </div>

      <div className="card">
        <span>Won Deals</span>
        <strong>
          {
            deals.filter(
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
          "LEAD",
          "QUALIFIED",
          "PROPOSAL",
          "NEGOTIATION",
          "WON",
        ].map((stage) => {
          const stageDeals = deals.filter(
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
                        ₹
                        {Number(
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
                  deals.filter(
                    (deal) =>
                      deal.stage === "LOST"
                  ).length
                }{" "}
                deals
              </span>
            </div>

            <strong>
              ₹
              {deals
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
            {deals
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

      {deals.length === 0 ? (
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
            {deals.slice(0, 10).map((deal) => (
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
                                handleEditCompany(
                                  company
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteCompany(
                                  company.id
                                )
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
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
                  value={
                    dealForm.stage
                  }
                  onChange={
                    handleDealChange
                  }
                  required
                >
                  <option value="LEAD">
                    Lead
                  </option>

                  <option value="QUALIFIED">
                    Qualified
                  </option>

                  <option value="PROPOSAL">
                    Proposal
                  </option>

                  <option value="NEGOTIATION">
                    Negotiation
                  </option>

                  <option value="WON">
                    Won
                  </option>

                  <option value="LOST">
                    Lost
                  </option>
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

                  {companies.map(
                    (company) => (
                      <option
                        key={
                          company.id
                        }
                        value={
                          company.id
                        }
                      >
                        {company.name}
                      </option>
                    )
                  )}
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
                  value={
                    dealForm.requirements
                  }
                  onChange={
                    handleDealChange
                  }
                />

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
  />

  <select
    value={dealStageFilter}
    onChange={(event) =>
      setDealStageFilter(event.target.value)
    }
  >
    <option value="">All Stages</option>
    <option value="LEAD">Lead</option>
    <option value="QUALIFIED">Qualified</option>
    <option value="PROPOSAL">Proposal</option>
    <option value="NEGOTIATION">Negotiation</option>
    <option value="WON">Won</option>
    <option value="LOST">Lost</option>
  </select>

  <select
    value={dealCompanyFilter}
    onChange={(event) =>
      setDealCompanyFilter(event.target.value)
    }
  >
    <option value="">All Companies</option>

    {companies.map((company) => (
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
    onChange={(event) =>
      setDealOwnerFilter(event.target.value)
    }
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

  <button
    type="button"
    onClick={() => {
      setDealSearch("");
      setDealStageFilter("");
      setDealCompanyFilter("");
      setDealOwnerFilter("");
    }}
  >
    Clear Filters
  </button>
</div>

<p className="filter-result">
  Showing {filteredDeals.length} of {deals.length} deals
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
                                onClick={() =>
                                  handleEditDeal(
                                    deal
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  handleDeleteDeal(
                                    deal.id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        )
                      )}
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