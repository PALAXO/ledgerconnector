import javafx.geometry.HPos;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;

public class LookUpTab extends Tab {

    private GridPane gP = new GridPane();

    private TextField privateKeyTxt = new TextField();
    private TextField addressTxt = new TextField();
    private TextArea contentTxt = new TextArea();

    public LookUpTab() {
        this.setText("Look Up");
        this.setContent(gP);

        gP.setHgap(5);
        gP.setVgap(10);
        gP.alignmentProperty().set(Pos.TOP_CENTER);
        gP.setPadding(new Insets(10));

        ColumnConstraints col1 = new ColumnConstraints();
        col1.setPercentWidth(20);
        col1.setHalignment(HPos.RIGHT);

        ColumnConstraints col2 = new ColumnConstraints();
        col2.setPercentWidth(60);
        col2.setHalignment(HPos.LEFT);

        gP.getColumnConstraints().addAll(col1, col2);

        createForm();
        createContentDisplay();
    }

    private void createForm() {
        gP.addColumn(0,
                new Label("Wallet private key"),
                new Label("Content address"));

        gP.addColumn(1, privateKeyTxt, addressTxt);

        Button lookUpBtn = new Button("Look up");
        lookUpBtn.setOnAction(event -> {
            // TODO look up data on blockchain
        });

        HBox hBox = new HBox(lookUpBtn);
        hBox.setAlignment(Pos.CENTER_RIGHT);

        gP.add(hBox, 1, 2);
    }

    private void createContentDisplay() {
        contentTxt.setEditable(false);
        gP.add(contentTxt, 1, 3);
    }
}
