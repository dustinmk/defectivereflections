
module.exports = ({htmlWebpackPlugin}) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>defectivereflections</title>
    <script type="text/javascript" src="https://spectorcdn.babylonjs.com/spector.bundle.js"></script>
</head>
<body>
    ${htmlWebpackPlugin.tags.bodyTags}
</body>
</html>
`;
}