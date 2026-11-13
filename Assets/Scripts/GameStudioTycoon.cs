using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Dependency-free, playable Unity 6 prototype for Indie Empire.
/// Add this component to an empty GameObject in a URP scene and press Play.
/// The interface uses Unity IMGUI so the prototype needs no prefabs or packages.
/// </summary>
public sealed class GameStudioTycoon : MonoBehaviour
{
    private const string SaveKey = "IndieEmpire.Save.v1";
    private StudioSave save;
    private string page = "Overview";
    private Vector2 scroll;
    private GUIStyle titleStyle, headingStyle, bodyStyle, mutedStyle, cardStyle, buttonStyle, smallStyle;
    private bool stylesReady;
    private string notice = "Your studio is open. Mosslight is in development.";

    [Serializable] private sealed class TeamMember
    {
        public string name, role;
        public int skill, salary;
    }
    [Serializable] private sealed class GameRelease
    {
        public string name, genre;
        public int quality, dailyRoyalty;
    }
    [Serializable] private sealed class StudioProject
    {
        public string name, genre, platform;
        public int progress, budget;
    }
    [Serializable] private sealed class StudioSave
    {
        public int day = 14, month = 4, year = 2025;
        public int cash = 24850, reputation = 68, officeLevel = 1, marketing = 0;
        public int daysPlayed;
        public StudioProject project;
        public List<TeamMember> team = new List<TeamMember>();
        public List<GameRelease> releases = new List<GameRelease>();
        public List<string> research = new List<string>();
    }

    private void Awake()
    {
        Load();
        if (save.team.Count == 0)
        {
            save.team.Add(new TeamMember { name = "Avery Lin", role = "Game designer", skill = 7, salary = 95 });
            save.team.Add(new TeamMember { name = "Morgan Kim", role = "Programmer", skill = 8, salary = 115 });
            save.team.Add(new TeamMember { name = "Rory Patel", role = "Artist", skill = 6, salary = 85 });
            save.team.Add(new TeamMember { name = "Jamie Davis", role = "Studio founder", skill = 5, salary = 0 });
        }
        if (save.project == null && save.releases.Count == 0)
            save.project = new StudioProject { name = "Mosslight", genre = "Adventure", platform = "PC", progress = 42, budget = 12000 };
    }

    private void OnGUI()
    {
        EnsureStyles();
        float scale = Mathf.Min(Screen.width / 900f, 1.2f);
        GUI.matrix = Matrix4x4.Scale(new Vector3(scale, scale, 1));
        float width = Screen.width / scale;
        float height = Screen.height / scale;
        DrawHeader(width);
        float top = 154;
        scroll = GUI.BeginScrollView(new Rect(0, top, width, height - top), scroll,
            new Rect(0, 0, width - 18, 1100));
        GUILayout.BeginArea(new Rect(28, 12, width - 74, 1060));
        DrawPage(width - 74);
        GUILayout.EndArea();
        GUI.EndScrollView();
        GUI.matrix = Matrix4x4.identity;
    }

    private void DrawHeader(float width)
    {
        GUI.Box(new Rect(0, 0, width, 154), GUIContent.none, cardStyle);
        GUILayout.BeginArea(new Rect(28, 12, width - 56, 134));
        GUILayout.BeginHorizontal();
        GUILayout.Label("✳  INDIE EMPIRE", titleStyle);
        GUILayout.FlexibleSpace();
        GUILayout.Label("PINECONE GAMES", smallStyle, GUILayout.Width(150));
        GUILayout.EndHorizontal();
        GUILayout.Space(5);
        GUILayout.BeginHorizontal();
        string[] tabs = { "Overview", "Projects", "Team", "Office", "Research", "Market" };
        foreach (string tab in tabs)
        {
            GUIStyle style = page == tab ? buttonStyle : smallStyle;
            if (GUILayout.Button(tab, style, GUILayout.Height(30))) page = tab;
        }
        GUILayout.EndHorizontal();
        GUILayout.Space(7);
        GUILayout.BeginHorizontal();
        GUILayout.Label("CASH  " + Money(save.cash), headingStyle, GUILayout.Width(160));
        GUILayout.Label("TEAM  " + save.team.Count, bodyStyle, GUILayout.Width(110));
        GUILayout.Label("REPUTATION  " + save.reputation + " / 100", bodyStyle);
        GUILayout.FlexibleSpace();
        if (GUILayout.Button("▶  NEXT DAY", buttonStyle, GUILayout.Width(135), GUILayout.Height(34))) AdvanceDay(false);
        GUILayout.EndHorizontal();
        GUILayout.EndArea();
    }

    private void DrawPage(float width)
    {
        GUILayout.Label("GOOD MORNING, FOUNDER  ✳", mutedStyle);
        GUILayout.Label(page == "Overview" ? "Build your little corner of the world." : page, titleStyle);
        GUILayout.Label("Day " + save.day + " · " + MonthName(save.month) + " " + save.year + "     " + notice, mutedStyle);
        GUILayout.Space(16);
        switch (page)
        {
            case "Overview": DrawOverview(width); break;
            case "Projects": DrawProjects(); break;
            case "Team": DrawTeam(); break;
            case "Office": DrawOffice(); break;
            case "Research": DrawResearch(); break;
            case "Market": DrawMarket(); break;
        }
    }

    private void DrawOverview(float width)
    {
        Card("ACTIVE PROJECT", () => {
            if (save.project == null) GUILayout.Label("No game in development. Visit Projects to start your next adventure.", bodyStyle);
            else
            {
                GUILayout.Label(save.project.name + "  ·  " + save.project.genre, headingStyle);
                GUILayout.Label(save.project.platform + "  ·  Production  ·  " + save.project.progress + "% complete", bodyStyle);
                GUILayout.HorizontalSlider(save.project.progress, 0, 100);
                GUILayout.Space(6);
                GUILayout.BeginHorizontal();
                GUILayout.Label("Team of " + Mathf.Min(3, save.team.Count) + " · " + Mathf.Max(1, Mathf.CeilToInt((100 - save.project.progress) / (float)DailyProgress() / 7f)) + " weeks to go", mutedStyle);
                GUILayout.FlexibleSpace();
                if (GUILayout.Button("✦  WORK ON GAME", buttonStyle, GUILayout.Width(180), GUILayout.Height(38))) AdvanceDay(true);
                GUILayout.EndHorizontal();
            }
        });
        GUILayout.BeginHorizontal();
        Card("STUDIO FINANCES", () => {
            GUILayout.Label(Money(save.cash), titleStyle);
            GUILayout.Label("Weekly revenue  " + Money(WeeklyRevenue()), bodyStyle);
            GUILayout.Label("Daily team payroll  " + Money(DailyPayroll()), mutedStyle);
        });
        Card("YOUR TEAM", () => {
            GUILayout.Label(save.team.Count + " creative people", titleStyle);
            GUILayout.Label("A good team makes better games.", bodyStyle);
            if (GUILayout.Button("Meet new talent →", smallStyle)) page = "Team";
        });
        GUILayout.EndHorizontal();
        Card("STUDIO GOALS", () => {
            Goal(save.releases.Count > 0, "Ship your first game");
            Goal(save.team.Count >= 5, "Grow your team to 5 (" + save.team.Count + ")");
            Goal(save.research.Count > 0, "Complete a research project");
        });
        Card("STUDIO ACTIVITY", () => GUILayout.Label(notice, bodyStyle));
    }

    private void DrawProjects()
    {
        if (save.project != null)
        {
            Card("IN DEVELOPMENT", () => {
                GUILayout.Label(save.project.name + " · " + save.project.progress + "%", headingStyle);
                GUILayout.Label(save.project.genre + " · " + save.project.platform, bodyStyle);
                if (GUILayout.Button("Work on the game (uses a day)", buttonStyle, GUILayout.Height(38))) AdvanceDay(true);
            });
            GUILayout.Label("Finish the active game before starting another.", mutedStyle);
        }
        else
        {
            GUILayout.Label("Choose a game to develop. Your team will make progress each day.", bodyStyle);
            ProjectCard("Starlit Harbor", "Cozy simulation", "PC", 9000);
            ProjectCard("Neon Courier", "Arcade action", "PC", 10500);
            ProjectCard("Pocket Planet", "Puzzle adventure", "Mobile", 8000);
        }
        if (save.releases.Count > 0) Card("RELEASED GAMES", () => {
            foreach (GameRelease game in save.releases)
                GUILayout.Label("★  " + game.name + "  ·  " + game.quality + "% player rating  ·  " + Money(game.dailyRoyalty) + "/day royalties", bodyStyle);
        });
    }

    private void DrawTeam()
    {
        Card("YOUR STUDIO ROSTER", () => {
            foreach (TeamMember member in save.team)
                GUILayout.Label(member.name + "   ·   " + member.role + "   ·   Skill " + member.skill + "   ·   " + (member.salary == 0 ? "Founder" : Money(member.salary) + "/day"), bodyStyle);
        });
        GUILayout.Label("Invite a teammate · one-time signing bonus is one week of salary", headingStyle);
        HireCard("Designer", 90, 6, "Shapes the fun and feel of every game.");
        HireCard("Programmer", 120, 7, "Turns big ideas into playable worlds.");
        HireCard("Artist", 85, 6, "Gives your games their visual soul.");
        HireCard("Producer", 105, 6, "Keeps projects and people on track.");
        HireCard("Marketer", 95, 5, "Helps the right players find your games.");
    }

    private void DrawOffice()
    {
        string[] names = { "The spare room", "Creative loft", "Downtown studio", "Global headquarters" };
        int[] costs = { 8500, 22000, 45000, 0 };
        int level = Mathf.Clamp(save.officeLevel, 1, 4);
        Card("LEVEL " + level + " · " + names[level - 1], () => {
            GUILayout.Label("Team capacity  " + (level * 5) + " people", bodyStyle);
            GUILayout.Label("Office upkeep  " + Money(level * 24) + " per day", bodyStyle);
            GUILayout.Label("A more inspiring home for your growing studio.", mutedStyle);
            if (level < 4 && GUILayout.Button("Upgrade office · " + Money(costs[level - 1]), buttonStyle, GUILayout.Height(40))) UpgradeOffice();
            if (level == 4) GUILayout.Label("Your studio has reached its full size!", headingStyle);
        });
    }

    private void DrawResearch()
    {
        ResearchCard("Agile workflows", "A tighter production pipeline. +2 development progress per day.", 4500, "agile");
        ResearchCard("Player insights", "Understand your audience. +8 quality on new releases.", 6000, "insights");
        ResearchCard("Cross-platform tools", "Reach more players with better platform support.", 9000, "platforms");
        ResearchCard("Community building", "Build a loyal fanbase. +15% game royalties.", 3800, "community");
        Card("COMPLETED RESEARCH", () => GUILayout.Label(save.research.Count == 0 ? "No discoveries yet. Choose an upgrade to get started." : string.Join(", ", save.research.ToArray()), bodyStyle));
    }

    private void DrawMarket()
    {
        Card("COMMUNITY CAMPAIGN", () => {
            GUILayout.Label("Creator previews, a dev diary, and a cozy little launch event.", bodyStyle);
            GUILayout.Label("Costs $2,500 · +4 reputation · more opening players", mutedStyle);
            if (GUILayout.Button("Launch campaign · $2,500", buttonStyle, GUILayout.Height(40))) Campaign();
        });
        Card("STUDIOS TO WATCH", () => {
            GUILayout.Label("Moonbeam Studio     ·     Cozy adventure     ·     28% genre share", bodyStyle);
            GUILayout.Label("Bit Orchard               ·     Indie platformer       ·     22% genre share", bodyStyle);
            GUILayout.Label("Copper Kite              ·     Narrative RPG           ·     17% genre share", bodyStyle);
        });
        Card("YOUR AUDIENCE", () => {
            GUILayout.Label("Studio reputation  " + save.reputation + " / 100", headingStyle);
            GUILayout.Label("Every great release helps players discover your next game.", bodyStyle);
        });
    }

    private void ProjectCard(string name, string genre, string platform, int budget)
    {
        Card(name.ToUpperInvariant(), () => {
            GUILayout.Label(genre + " · " + platform + " · " + Money(budget) + " project budget", bodyStyle);
            if (GUILayout.Button("Start development →", buttonStyle, GUILayout.Height(36))) StartProject(name, genre, platform, budget);
        });
    }

    private void HireCard(string role, int salary, int skill, string description)
    {
        Card("HIRE A " + role.ToUpperInvariant(), () => {
            GUILayout.Label(description + "  " + Money(salary) + "/day · " + Money(salary * 7) + " signing bonus", bodyStyle);
            bool capacity = save.team.Count < save.officeLevel * 5;
            GUI.enabled = capacity;
            if (GUILayout.Button(capacity ? "Invite to the studio" : "Upgrade your office for more space", buttonStyle, GUILayout.Height(34))) Hire(role, salary, skill);
            GUI.enabled = true;
        });
    }

    private void ResearchCard(string title, string description, int cost, string key)
    {
        Card(title.ToUpperInvariant(), () => {
            GUILayout.Label(description, bodyStyle);
            bool done = save.research.Contains(key);
            GUI.enabled = !done;
            if (GUILayout.Button(done ? "✓  COMPLETED" : "Fund research · " + Money(cost), buttonStyle, GUILayout.Height(36)) && !done) BuyResearch(title, key, cost);
            GUI.enabled = true;
        });
    }

    private void Card(string title, Action content)
    {
        GUILayout.BeginVertical(cardStyle);
        GUILayout.Label(title, mutedStyle);
        GUILayout.Space(6);
        content();
        GUILayout.EndVertical();
        GUILayout.Space(8);
    }

    private void Goal(bool done, string text) => GUILayout.Label((done ? "✓" : "○") + "   " + text, bodyStyle);

    private int DailyProgress()
    {
        int points = 0;
        foreach (TeamMember member in save.team) points += member.skill;
        return Mathf.Max(3, Mathf.RoundToInt(points * .22f) + (save.research.Contains("agile") ? 2 : 0));
    }

    private void AdvanceDay(bool focused)
    {
        int royalties = 0;
        foreach (GameRelease release in save.releases)
            royalties += save.research.Contains("community") ? Mathf.RoundToInt(release.dailyRoyalty * 1.15f) : release.dailyRoyalty;
        int payroll = DailyPayroll();
        save.cash += royalties + Mathf.FloorToInt(save.marketing * .1f) - payroll - save.officeLevel * 24;
        save.day++;
        if (save.day > DateTime.DaysInMonth(save.year, save.month))
        {
            save.day = 1;
            save.month++;
            if (save.month > 12) { save.month = 1; save.year++; }
        }
        save.daysPlayed++;
        if (save.project != null)
        {
            int gain = DailyProgress();
            if (focused) gain += Mathf.Max(5, Mathf.RoundToInt(save.team.Count * 2.5f));
            save.project.progress = Mathf.Min(100, save.project.progress + gain);
            notice = save.project.name + " gained " + gain + " development points today.";
            if (save.project.progress >= 100) ReleaseGame();
        }
        else notice = "The studio day is done. Your team is ready for its next project.";
        if (save.cash < 0) save.reputation = Mathf.Max(0, save.reputation - 1);
        Save();
    }

    private void ReleaseGame()
    {
        StudioProject project = save.project;
        int quality = Mathf.Clamp(52 + save.reputation / 12 + save.research.Count * 3 + UnityEngine.Random.Range(0, 13), 48, 98);
        int royalty = 90 + quality * 5 + save.marketing;
        if (save.research.Contains("community")) royalty = Mathf.RoundToInt(royalty * 1.15f);
        int openingSales = 450 + quality * 45 + save.marketing;
        save.releases.Insert(0, new GameRelease { name = project.name, genre = project.genre, quality = quality, dailyRoyalty = royalty });
        save.cash += openingSales;
        save.reputation = Mathf.Min(100, save.reputation + 8);
        save.project = null;
        notice = project.name + " launched to a " + quality + "% player rating! Opening sales: " + Money(openingSales) + ".";
    }

    private void StartProject(string name, string genre, string platform, int budget)
    {
        if (save.cash < budget) { notice = "Not enough cash for this project."; return; }
        save.cash -= budget;
        save.project = new StudioProject { name = name, genre = genre, platform = platform, progress = 0, budget = budget };
        notice = name + " is in development. Let's make something great!";
        page = "Overview";
        Save();
    }

    private void Hire(string role, int salary, int skill)
    {
        int bonus = salary * 7;
        if (save.cash < bonus) { notice = "You need " + Money(bonus) + " for the signing bonus."; return; }
        string[] first = { "Sam", "Alex", "Taylor", "Casey", "Jordan", "Robin" };
        string[] last = { "Park", "Reed", "Stone", "Bell", "Brooks", "Wells" };
        string name = first[UnityEngine.Random.Range(0, first.Length)] + " " + last[UnityEngine.Random.Range(0, last.Length)];
        save.cash -= bonus;
        save.team.Add(new TeamMember { name = name, role = role, skill = skill, salary = salary });
        notice = name + " joined as your new " + role.ToLowerInvariant() + ".";
        Save();
    }

    private void UpgradeOffice()
    {
        int[] costs = { 8500, 22000, 45000 };
        int cost = costs[Mathf.Clamp(save.officeLevel - 1, 0, costs.Length - 1)];
        if (save.cash < cost) { notice = "The office upgrade costs " + Money(cost) + "."; return; }
        save.cash -= cost;
        save.officeLevel++;
        save.reputation = Mathf.Min(100, save.reputation + 3);
        notice = "Your studio moved into a bigger office!";
        Save();
    }

    private void BuyResearch(string title, string key, int cost)
    {
        if (save.cash < cost) { notice = "Not enough cash to fund this research."; return; }
        save.cash -= cost;
        save.research.Add(key);
        if (key == "community") save.reputation = Mathf.Min(100, save.reputation + 5);
        notice = "Research complete: " + title + ".";
        Save();
    }

    private void Campaign()
    {
        const int cost = 2500;
        if (save.cash < cost) { notice = "Not enough cash for a campaign."; return; }
        save.cash -= cost;
        save.marketing += 500;
        save.reputation = Mathf.Min(100, save.reputation + 4);
        notice = "Campaign launched! New players are discovering your studio.";
        Save();
    }

    private int DailyPayroll()
    {
        int sum = 0;
        foreach (TeamMember member in save.team) sum += member.salary;
        return sum;
    }
    private int WeeklyRevenue()
    {
        int sum = 0;
        foreach (GameRelease release in save.releases) sum += release.dailyRoyalty * 7;
        return sum;
    }
    private static string Money(int value) => "$" + Mathf.Max(0, value).ToString("N0");
    private static string MonthName(int month)
    {
        string[] months = { "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" };
        return months[Mathf.Clamp(month - 1, 0, 11)];
    }

    private void Load()
    {
        if (PlayerPrefs.HasKey(SaveKey))
        {
            try { save = JsonUtility.FromJson<StudioSave>(PlayerPrefs.GetString(SaveKey)); } catch { save = null; }
        }
        if (save == null) save = new StudioSave();
        if (save.team == null) save.team = new List<TeamMember>();
        if (save.releases == null) save.releases = new List<GameRelease>();
        if (save.research == null) save.research = new List<string>();
    }

    private void Save()
    {
        PlayerPrefs.SetString(SaveKey, JsonUtility.ToJson(save));
        PlayerPrefs.Save();
    }

    private void EnsureStyles()
    {
        if (stylesReady) return;
        titleStyle = new GUIStyle(GUI.skin.label) { fontSize = 23, fontStyle = FontStyle.Bold, wordWrap = true };
        headingStyle = new GUIStyle(GUI.skin.label) { fontSize = 15, fontStyle = FontStyle.Bold, wordWrap = true };
        bodyStyle = new GUIStyle(GUI.skin.label) { fontSize = 12, wordWrap = true, padding = new RectOffset(2, 2, 5, 5) };
        mutedStyle = new GUIStyle(GUI.skin.label) { fontSize = 10, wordWrap = true, normal = { textColor = new Color(.40f,.48f,.43f) } };
        cardStyle = new GUIStyle(GUI.skin.box) { padding = new RectOffset(15, 15, 12, 12), margin = new RectOffset(0, 0, 5, 5), normal = { background = MakeTexture(new Color(.96f,.98f,.96f)) } };
        buttonStyle = new GUIStyle(GUI.skin.button) { fontSize = 11, fontStyle = FontStyle.Bold, fixedHeight = 32, wordWrap = true, normal = { textColor = new Color(.12f,.40f,.28f), background = MakeTexture(new Color(.83f,.93f,.86f)) } };
        smallStyle = new GUIStyle(GUI.skin.button) { fontSize = 10, fixedHeight = 27, wordWrap = true };
        stylesReady = true;
    }

    private static Texture2D MakeTexture(Color color)
    {
        Texture2D texture = new Texture2D(1, 1);
        texture.hideFlags = HideFlags.HideAndDontSave;
        texture.SetPixel(0, 0, color);
        texture.Apply();
        return texture;
    }

    private void OnApplicationPause(bool paused) { if (paused) Save(); }
    private void OnApplicationQuit() { Save(); }
}
