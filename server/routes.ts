  // Helper function to send notification emails
  const sendNotificationEmail = async (subject: string, htmlBody: string) => {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !gmailPass) {
      console.log("Email notifications disabled - GMAIL credentials not configured");
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      await transporter.sendMail({
        from: `"Soup Shoppe" <${gmailUser}>`,
        to: gmailUser,
        subject,
        html: htmlBody,
      });
      console.log(`Notification email sent: ${subject}`);
    } catch (error) {
      console.error("Failed to send notification email:", error);
    }
  };

  // Menu Suggestions - public endpoint
  app.post("/api/menu-suggestions", async (req, res) => {
    try {
      const { guestName, contactEmail, contactPhone, itemName, itemType, description } = req.body;
      if (!guestName || !itemName || !itemType) {
        return res.status(400).json({ error: "Name, item name, and item type are required" });
      }
      const suggestion = await storage.createMenuSuggestion({
        guestName, contactEmail: contactEmail || null, contactPhone: contactPhone || null,
        itemName, itemType, description: description || null,
      });

      sendNotificationEmail(`New Menu Suggestion: ${itemName}`, `
        <h2>New Menu Suggestion from Soup Shoppe Website</h2>
        <p><strong>From:</strong> ${guestName}</p>
        <p><strong>Item Name:</strong> ${itemName}</p>
        <p><strong>Type:</strong> ${itemType}</p>
        ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
        ${contactEmail ? `<p><strong>Email:</strong> ${contactEmail}</p>` : ''}
        ${contactPhone ? `<p><strong>Phone:</strong> ${contactPhone}</p>` : ''}
        <hr><p><a href="https://www.mysoupshoppe.com/admin">View in Admin Dashboard</a></p>
      `);

      res.json({ success: true, message: "Thank you for your suggestion!", suggestion });
    } catch (error) {
      console.error("Error creating menu suggestion:", error);
      res.status(500).json({ error: "Failed to submit suggestion." });
    }
  });

  // Menu Suggestions - admin endpoints
  app.get("/api/admin/menu-suggestions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const suggestions = await storage.getAllMenuSuggestions();
    res.json(suggestions);
  });

  app.patch("/api/admin/menu-suggestions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const { status } = req.body;
    if (!["new", "reviewed", "implemented"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const updated = await storage.updateMenuSuggestionStatus(req.params.id, status);
    res.json(updated);
  });

  // Delivery Enrollment - public endpoint
  app.post("/api/delivery-enrollment", async (req, res) => {
    try {
      const { guestName, phoneNumber, optInConfirmed, preferredContactWindow, notes } = req.body;
      if (!guestName || !phoneNumber) {
        return res.status(400).json({ error: "Name and phone number are required" });
      }
      if (!optInConfirmed) {
        return res.status(400).json({ error: "You must agree to receive text messages" });
      }
      const enrollment = await storage.createDeliveryEnrollment({
        guestName, phoneNumber, optInConfirmed,
        preferredContactWindow: preferredContactWindow || null, notes: notes || null,
      });

      sendNotificationEmail(`New Delivery Signup: ${guestName}`, `
        <h2>New Delivery Program Enrollment</h2>
        <p><strong>Name:</strong> ${guestName}</p>
        <p><strong>Phone:</strong> ${phoneNumber}</p>
        ${preferredContactWindow ? `<p><strong>Preferred Time:</strong> ${preferredContactWindow}</p>` : ''}
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        <hr><p><a href="https://www.mysoupshoppe.com/admin">View in Admin Dashboard</a></p>
      `);

      res.json({ success: true, message: "You're enrolled!", enrollment });
    } catch (error) {
      console.error("Error creating delivery enrollment:", error);
      res.status(500).json({ error: "Failed to enroll." });
    }
  });

  // Delivery Enrollment - admin endpoints
  app.get("/api/admin/delivery-enrollments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const enrollments = await storage.getAllDeliveryEnrollments();
    res.json(enrollments);
  });

  app.get("/api/admin/delivery-enrollments/csv", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const enrollments = await storage.getAllDeliveryEnrollments();
    const csv = [
      "Name,Phone Number,Opt-In,Preferred Time,Notes,Date",
      ...enrollments.map(e => 
        `"${e.guestName}","${e.phoneNumber}",${e.optInConfirmed},"${e.preferredContactWindow || ''}","${e.notes || ''}","${e.createdAt}"`
      )
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=delivery-enrollments.csv");
    res.send(csv);
  });
