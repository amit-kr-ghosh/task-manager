import React, { useEffect, useState } from "react";
import { FaHandPointRight } from "react-icons/fa";
import axios from "axios";

const MainNote = ({ notes, setNotes }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/note/getNote`,
          {
            withCredentials: true,
          },
        );

        // Show only the latest 3 notes on dashboard
        const recentNotes = Array.isArray(response.data)
          ? response.data.slice(-3).reverse()
          : [];

        setNotes(recentNotes);
      } catch (err) {
        console.error("Failed to fetch notes:", err);

        if (err.response?.status === 401) {
          setError("Please login again.");
        } else {
          setError("Unable to load notes.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [setNotes]);

  return (
    <div className="scroller">
      <div className="content-note scroller-inner">
        {/* Intro Card */}
        <div className="scroller-con">
          <div className="dots">
            <p id="one"></p>
            <p id="two"></p>
            <p id="three"></p>
          </div>
          <span id="scroller-con-col">
            "Effortlessly Organize Your Thoughts."
          </span>
          <br />
          <br />
          Elevate your note-taking game, one click at a time.
        </div>

        {/* Recent Notes Header */}
        <div className="scroller-con">
          <div className="dots">
            <p id="one"></p>
            <p id="two"></p>
            <p id="three"></p>
          </div>
          <span id="scroller-con-col">
            Capture ideas, set reminders, and stay organized.
          </span>
          <br />
          <br />
          Some of your recently added notes...
          <br />
          <FaHandPointRight
            size={30}
            style={{
              marginLeft: "50%",
              marginTop: "10px",
            }}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="dash-note-status">Loading your notes...</div>
        )}

        {/* Error */}
        {!loading && error && <div className="dash-note-status">{error}</div>}

        {/* No Notes */}
        {!loading && !error && notes.length === 0 && (
          <div className="dash-note-status">
            No notes yet. Create your first note!
          </div>
        )}

        {/* Notes */}
        {!loading &&
          !error &&
          notes.map((eachNote) => (
            <textarea
              key={eachNote._id || eachNote.id}
              value={eachNote.noteText || ""}
              id="dash-note-con"
              className="dashboard-note"
              readOnly
              aria-label="Saved note"
            />
          ))}
      </div>
    </div>
  );
};

export default MainNote;
