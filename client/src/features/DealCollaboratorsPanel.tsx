import { useEffect, useState } from "react";

type Collaborator = {
  id: number;
  dealId: number;
  userId: number;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
};

type SalesUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
};

type Props = {
  dealId: number;
  ownerId: number;
  apiUrl: string;
  token: string;
  currentUserId: number;
  currentUserRole: string;
};

export default function DealCollaboratorsPanel({
  dealId,
  ownerId,
  apiUrl,
  token,
  currentUserId,
  currentUserRole,
}: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canManage =
    currentUserRole === "ADMIN" ||
    currentUserRole === "MANAGER" ||
    currentUserId === ownerId;

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${apiUrl}/deals/${dealId}/collaborators`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load collaborators");
      }

      setCollaborators(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load collaborators"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadSalesUsers = async () => {
    try {
      const response = await fetch(`${apiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load users");
      }

      setSalesUsers(
        data.filter(
          (user: SalesUser) =>
            user.role === "SALES" &&
            user.isActive !== false &&
            user.id !== ownerId
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load sales users"
      );
    }
  };

  useEffect(() => {
    loadCollaborators();

    if (canManage) {
      loadSalesUsers();
    }
  }, [dealId, ownerId, canManage]);

  const addCollaborator = async () => {
    if (!selectedUserId) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${apiUrl}/deals/${dealId}/collaborators`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: Number(selectedUserId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add collaborator");
      }

      setCollaborators((current) => [...current, data]);
      setSelectedUserId("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add collaborator"
      );
    } finally {
      setSaving(false);
    }
  };

  const removeCollaborator = async (userId: number) => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${apiUrl}/deals/${dealId}/collaborators/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to remove collaborator"
        );
      }

      setCollaborators((current) =>
        current.filter((collaborator) => collaborator.userId !== userId)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove collaborator"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="deal-collaborators"
      style={{
      gridColumn: "1 / -1",
      width: "100%",
      boxSizing: "border-box",
    }}>
        <h3>Collaborators</h3>
        <p>Loading collaborators...</p>
      </div>
    );
  }

  return (
    <div className="deal-collaborators"
     style={{
        gridColumn: "1 / -1",
        width: "100%",
        boxSizing: "border-box",
      }}>
      <div className="deal-collaborators-header">
        <h3>Collaborators</h3>
        <span>{collaborators.length}</span>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {collaborators.length === 0 ? (
        <p>No collaborators assigned.</p>
      ) : (
        <div className="collaborator-list">
          {collaborators.map((collaborator) => (
            <div
              className="collaborator-item"
              key={collaborator.id}
            >
              <div>
                <strong>{collaborator.user.name}</strong>
                <small>{collaborator.user.email}</small>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={() =>
                    removeCollaborator(collaborator.userId)
                  }
                  disabled={saving}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <div className="add-collaborator">
          <select
            value={selectedUserId}
            onChange={(event) =>
              setSelectedUserId(event.target.value)
            }
            disabled={saving}
          >
            <option value="">Select sales representative</option>

            {salesUsers
              .filter(
                (user) =>
                  !collaborators.some(
                    (collaborator) =>
                      collaborator.userId === user.id
                  )
              )
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
          </select>

          <button
            type="button"
            onClick={addCollaborator}
            disabled={!selectedUserId || saving}
          >
            {saving ? "Saving..." : "Add Collaborator"}
          </button>
        </div>
      )}
    </div>
  );
}