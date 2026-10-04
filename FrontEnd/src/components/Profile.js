import React, { useEffect, useState } from "react";
import DarkMode from "./DarkMode/Darkmode";
import Notification from "./Notification/Notification";
import { IoMdNotifications } from "react-icons/io";
import { TfiReload } from "react-icons/tfi";
import TypeWriter from "typewriter-effect";
import Calendar from "./Calendar/Calendar";
import axios from "axios";
import Aos from "aos";
import "aos/dist/aos.css";

const Profile = ({ tasks }) => {
  const [quote, setQuote] = useState("Stay focused and keep moving forward.");
  const [author, setAuthor] = useState("Task Manager");
  const [user, setUser] = useState(null);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [dialog, setDialog] = useState({
    isLoading: false,
  });

  // ----------------------------------------------------
  // AXIOS
  // ----------------------------------------------------

  axios.defaults.withCredentials = true;

  // ----------------------------------------------------
  // FETCH QUOTE
  // ----------------------------------------------------

  const fetchQuote = async () => {
    try {
      setQuoteLoading(true);

      const response = await fetch("https://dummyjson.com/quotes/random");

      if (!response.ok) {
        throw new Error("Failed to fetch quote");
      }

      const data = await response.json();

      if (data?.quote && data?.author) {
        setQuote(data.quote);
        setAuthor(data.author);
      }
    } catch (error) {
      console.error("Quote fetch error:", error);

      // Fallback quote so "undefined" never appears
      setQuote("The secret of getting ahead is getting started.");
      setAuthor("Mark Twain");
    } finally {
      setQuoteLoading(false);
    }
  };

  // ----------------------------------------------------
  // INITIAL LOAD
  // ----------------------------------------------------

  useEffect(() => {
    Aos.init({ duration: 1200 });

    // Load quote
    fetchQuote();

    // Load logged-in user
    axios
      .get(`${process.env.REACT_APP_API_URL}/getUser`)
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
      });
  }, []);

  // ----------------------------------------------------
  // UPCOMING TASKS
  // ----------------------------------------------------

  useEffect(() => {
    const fetchUpcomingTasks = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/task/getTask`,
        );

        const today = new Date().toISOString().split("T")[0];

        const temp = Array.isArray(res.data)
          ? res.data.filter(
              (obj) => obj.done === false && obj.task?.deadline === today,
            )
          : [];

        setUpcomingTasks(temp);
      } catch (err) {
        console.error("Failed to fetch upcoming tasks:", err);
        setUpcomingTasks([]);
      }
    };

    fetchUpcomingTasks();
  }, [tasks]);

  // ----------------------------------------------------
  // NOTIFICATION
  // ----------------------------------------------------

  function openNotifi() {
    setDialog({
      isLoading: true,
    });
  }

  function closeNotifi() {
    setDialog({
      isLoading: false,
    });
  }

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------

  return (
    <React.Fragment>
      <div className="profile" data-aos="fade-left">
        {/* PROFILE HEADER */}
        <div className="profile-div">
          <DarkMode />

          <button
            className={upcomingTasks.length ? "bell" : ""}
            onClick={openNotifi}
            aria-label="Notifications"
          >
            <span id="noti-count">{upcomingTasks.length}</span>

            <span>
              <IoMdNotifications size={25} color="#3081D0" />
            </span>
          </button>

          <img
            title={user?.userName || "Profile"}
            id="prof-img"
            src={user?.picUrl || ""}
            alt="Profile"
          />
        </div>

        {/* NOTIFICATION DIALOG */}
        {dialog.isLoading && (
          <Notification
            closeNotifi={closeNotifi}
            upcomingTasks={upcomingTasks}
          />
        )}

        {/* CALENDAR */}
        <Calendar />

        {/* QUOTE */}
        <div className="quote-div" data-aos="zoom-in">
          <h3>
            <TypeWriter
              options={{
                autoStart: true,
                loop: true,
                delay: 70,
                strings: [
                  quoteLoading ? "Loading your quote..." : `" ${quote} "`,
                ],
              }}
            />
          </h3>

          <hr />

          <div className="quote-footer">
            <h4 id="auth-name">- {author}</h4>

            <button
              onClick={fetchQuote}
              disabled={quoteLoading}
              aria-label="Get another quote"
            >
              <TfiReload color="orangered" size={18} />
            </button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Profile;
